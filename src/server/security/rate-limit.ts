import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type RateLimitPolicy = "auth" | "onboarding" | "mutation" | "invite";

interface RateLimitConfig {
  limit: number;
  windowMs: number;
  message: string;
}

const RATE_LIMIT_CONFIG: Record<RateLimitPolicy, RateLimitConfig> = {
  auth: {
    limit: 10,
    windowMs: 60_000,
    message: "Muitas tentativas de autenticacao. Aguarde 1 minuto."
  },
  onboarding: {
    limit: 8,
    windowMs: 10 * 60_000,
    message: "Muitas tentativas de onboarding. Aguarde alguns minutos."
  },
  mutation: {
    limit: 120,
    windowMs: 60_000,
    message: "Voce atingiu o limite temporario de alteracoes. Aguarde 1 minuto."
  },
  invite: {
    limit: 6,
    windowMs: 10 * 60_000,
    message: "Muitas operacoes com convite. Aguarde alguns minutos."
  }
};

function isLocalHost(hostname: string | null) {
  if (!hostname) {
    return false;
  }

  return hostname === "localhost" || hostname === "127.0.0.1";
}

function shouldBypassRateLimit(request: Request) {
  if (process.env.NODE_ENV === "test") {
    return true;
  }

  try {
    return isLocalHost(new URL(request.url).hostname);
  } catch {
    return false;
  }
}

function extractClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return forwarded || realIp || "unknown";
}

function getWindowStart(now: Date, windowMs: number) {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

function buildRateLimitHeaders(config: RateLimitConfig, remaining: number, resetAt: Date) {
  return {
    "X-RateLimit-Limit": String(config.limit),
    "X-RateLimit-Remaining": String(Math.max(remaining, 0)),
    "X-RateLimit-Reset": String(Math.ceil(resetAt.getTime() / 1000))
  };
}

export function resolveRateLimitPolicy(
  path: string,
  method: string,
  explicitPolicy?: RateLimitPolicy | false
) {
  if (explicitPolicy === false) {
    return null;
  }

  if (explicitPolicy) {
    return explicitPolicy;
  }

  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
    return null;
  }

  if (path.startsWith("/api/auth/")) {
    return "auth";
  }

  if (path.startsWith("/api/onboarding/")) {
    return "onboarding";
  }

  if (path === "/api/casa/convite") {
    return "invite";
  }

  return "mutation";
}

export async function applyRateLimit(input: {
  request: Request;
  path: string;
  policy: RateLimitPolicy;
  userId?: string;
}) {
  if (shouldBypassRateLimit(input.request)) {
    return { limited: false as const, headers: {} };
  }

  const config = RATE_LIMIT_CONFIG[input.policy];
  const now = new Date();
  const windowStart = getWindowStart(now, config.windowMs);
  const resetAt = new Date(windowStart.getTime() + config.windowMs);
  const subject = input.userId ? `user:${input.userId}` : `ip:${extractClientIp(input.request)}`;
  const identifier = `${input.path}:${subject}`;

  const result = await prisma.$transaction(
    async (tx) => {
      const existing = await tx.rateLimitBucket.findUnique({
        where: {
          scope_identifier: {
            scope: input.policy,
            identifier
          }
        }
      });

      if (!existing || existing.windowStart.getTime() !== windowStart.getTime()) {
        await tx.rateLimitBucket.upsert({
          where: {
            scope_identifier: {
              scope: input.policy,
              identifier
            }
          },
          update: {
            count: 1,
            windowStart
          },
          create: {
            scope: input.policy,
            identifier,
            count: 1,
            windowStart
          }
        });

        return { limited: false as const, remaining: config.limit - 1 };
      }

      if (existing.count >= config.limit) {
        return { limited: true as const, remaining: 0 };
      }

      await tx.rateLimitBucket.update({
        where: {
          scope_identifier: {
            scope: input.policy,
            identifier
          }
        },
        data: {
          count: {
            increment: 1
          }
        }
      });

      return { limited: false as const, remaining: config.limit - (existing.count + 1) };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }
  );

  const headers = buildRateLimitHeaders(config, result.remaining, resetAt);

  if (result.limited) {
    return {
      limited: true as const,
      headers,
      response: NextResponse.json(
        { message: config.message },
        {
          status: 429,
          headers: {
            ...headers,
            "Retry-After": String(Math.ceil(config.windowMs / 1000))
          }
        }
      )
    };
  }

  return {
    limited: false as const,
    headers
  };
}
