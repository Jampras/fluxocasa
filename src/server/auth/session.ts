import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies, headers } from "next/headers";

import { getServerEnv } from "@/config/env";

const SESSION_COOKIE = "fluxocasa_session";

interface SessionPayload extends JWTPayload {
  userId: string;
}

function getSecretKey() {
  const { APP_SECRET } = getServerEnv();

  if (!APP_SECRET) {
    throw new Error("APP_SECRET nao configurado.");
  }

  return new TextEncoder().encode(APP_SECRET);
}

async function shouldUseSecureCookies() {
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "";
  const forwardedProto = headerStore.get("x-forwarded-proto");

  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    return false;
  }

  if (forwardedProto) {
    return forwardedProto === "https";
  }

  return process.env.NODE_ENV === "production";
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string) {
  try {
    const result = await jwtVerify<SessionPayload>(token, getSecretKey());
    return result.payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  const token = await createSessionToken({ userId });

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await shouldUseSecureCookies(),
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  return payload?.userId ?? null;
}

export { SESSION_COOKIE };
