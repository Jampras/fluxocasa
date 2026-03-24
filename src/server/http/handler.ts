import { NextResponse } from "next/server";
import { badRequest, serverError } from "./response";
import { isUserFacingError } from "./errors";
import { requireApiUser } from "@/server/auth/api";
import { applyRateLimit, resolveRateLimitPolicy, type RateLimitPolicy } from "@/server/security/rate-limit";
import {
  createRequestId,
  logApiRequestFailure,
  logApiRequestStart,
  logApiRequestSuccess
} from "@/server/observability/logger";
import { z } from "zod";

type RouteParams = Record<string, string | string[] | undefined>;
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getAllowedOrigins(request: Request) {
  const allowed = new Set<string>([new URL(request.url).origin]);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (appUrl) {
    try {
      allowed.add(new URL(appUrl).origin);
    } catch {
      // Ignore invalid optional app url here; env validation happens elsewhere.
    }
  }

  return allowed;
}

function isAllowedSource(value: string | null, allowedOrigins: Set<string>) {
  if (!value) {
    return false;
  }

  try {
    return allowedOrigins.has(new URL(value).origin);
  } catch {
    return false;
  }
}

interface RouteContext<TParams extends RouteParams = RouteParams> {
  params: Promise<TParams>;
}

interface HandlerArgs<TData = any, TParams extends RouteParams = RouteParams> {
  user: { id: string; [key: string]: any };
  data: TData;
  params: TParams;
  request: Request;
  requestId: string;
}

interface HandlerOptions<TSchema extends z.ZodTypeAny | undefined, TParams extends RouteParams = RouteParams> {
  auth?: boolean;
  csrf?: boolean;
  rateLimit?: RateLimitPolicy | false;
  schema?: TSchema;
  handler: (
    args: HandlerArgs<TSchema extends z.ZodTypeAny ? z.infer<TSchema> : any, TParams>
  ) => Promise<Response>;
}

/**
 * Centralized API Handler Wrapper
 * Handles:
 * 1. Authentication (via requireApiUser)
 * 2. Validation (via Zod schema with transformations)
 * 3. Centralized Error Handling & Logging
 * 4. Response Consistency
 */
export function apiHandler<
  TSchema extends z.ZodTypeAny | undefined = undefined,
  TParams extends RouteParams = RouteParams
>({
  auth = true,
  csrf = auth,
  rateLimit,
  schema,
  handler
}: HandlerOptions<TSchema, TParams>) {
  return async (request: Request, context: RouteContext<TParams>) => {
    const requestId = createRequestId();
    const startedAt = Date.now();
    const path = new URL(request.url).pathname;

    logApiRequestStart({
      requestId,
      method: request.method,
      path
    });

    try {
      let user: any = { id: "anonymous" };
      let data: any = null;
      let rateLimitHeaders: Record<string, string> = {};
      const params = ((await context?.params) ?? {}) as TParams;
      const rateLimitPolicy = resolveRateLimitPolicy(path, request.method, rateLimit);

      if (csrf && MUTATING_METHODS.has(request.method.toUpperCase())) {
        const allowedOrigins = getAllowedOrigins(request);
        const origin = request.headers.get("origin");
        const referer = request.headers.get("referer");

        if (!isAllowedSource(origin, allowedOrigins) && !isAllowedSource(referer, allowedOrigins)) {
          const response = badRequest("Origem da requisicao nao autorizada.");
          response.headers.set("X-Request-Id", requestId);
          return response;
        }
      }

      // 1. Authentication
      if (auth) {
        const authResult = await requireApiUser();
        if (authResult.error) {
          return authResult.error;
        }
        user = authResult.user;
      }

      if (rateLimitPolicy) {
        const limitResult = await applyRateLimit({
          request,
          path,
          policy: rateLimitPolicy,
          userId: auth ? user.id : undefined
        });

        if (limitResult.limited) {
          limitResult.response.headers.set("X-Request-Id", requestId);
          return limitResult.response;
        }

        rateLimitHeaders = limitResult.headers;
      }

      // 2. Validation
      if (schema) {
        let body;
        try {
          body = await request.json();
        } catch (e) {
          return badRequest("Corpo da requisicao invalido (JSON esperado).");
        }

        const result = schema.safeParse(body);
        if (!result.success) {
          return badRequest("Dados invalidos.", result.error.issues);
        }
        data = result.data;
      }

      // 3. Execution
      const response = await handler({ user, data, params, request, requestId });
      response.headers.set("X-Request-Id", requestId);
      Object.entries(rateLimitHeaders).forEach(([key, value]) => response.headers.set(key, value));

      logApiRequestSuccess({
        requestId,
        method: request.method,
        path,
        status: response.status,
        durationMs: Date.now() - startedAt
      });

      return response;
    } catch (error) {
      logApiRequestFailure({
        requestId,
        method: request.method,
        path,
        durationMs: Date.now() - startedAt,
        error
      });

      // 4. Error Response
      if (isUserFacingError(error)) {
        const response = NextResponse.json({ message: error.message }, { status: error.status });
        response.headers.set("X-Request-Id", requestId);
        return response;
      }

      const response = serverError();
      response.headers.set("X-Request-Id", requestId);
      return response;
    }
  };
}
