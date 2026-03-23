import { badRequest, serverError } from "./response";
import { requireApiUser } from "@/server/auth/api";
import {
  createRequestId,
  logApiRequestFailure,
  logApiRequestStart,
  logApiRequestSuccess
} from "@/server/observability/logger";
import { z } from "zod";

type RouteParams = Record<string, string | string[] | undefined>;

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
      const params = ((await context?.params) ?? {}) as TParams;

      // 1. Authentication
      if (auth) {
        const authResult = await requireApiUser();
        if (authResult.error) {
          return authResult.error;
        }
        user = authResult.user;
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
      if (error instanceof Error) {
        const response = badRequest(error.message);
        response.headers.set("X-Request-Id", requestId);
        return response;
      }

      const response = serverError();
      response.headers.set("X-Request-Id", requestId);
      return response;
    }
  };
}
