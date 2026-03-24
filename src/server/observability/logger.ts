import { isUserFacingError } from "@/server/http/errors";

type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  event: string;
  [key: string]: unknown;
}

function writeLog(level: LogLevel, payload: LogPayload) {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    ...payload
  };

  const serialized = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
}

export function createRequestId() {
  return crypto.randomUUID();
}

export function logApiRequestStart(input: {
  requestId: string;
  method: string;
  path: string;
}) {
  writeLog("info", {
    event: "api.request.start",
    ...input
  });
}

export function logApiRequestSuccess(input: {
  requestId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
}) {
  writeLog("info", {
    event: "api.request.success",
    ...input
  });
}

export function logApiRequestFailure(input: {
  requestId: string;
  method: string;
  path: string;
  durationMs: number;
  error: unknown;
}) {
  const userError = isUserFacingError(input.error) ? input.error : null;
  const normalizedError =
    input.error instanceof Error
      ? {
          name: input.error.name,
          message: input.error.message,
          userFacing: Boolean(userError),
          ...(userError ? { status: userError.status } : {}),
          ...(process.env.NODE_ENV !== "production" ? { stack: input.error.stack } : {})
        }
      : input.error;

  writeLog("error", {
    event: "api.request.failure",
    requestId: input.requestId,
    method: input.method,
    path: input.path,
    durationMs: input.durationMs,
    error: normalizedError
  });
}
