import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

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
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (appUrl) {
    try {
      const url = new URL(appUrl);
      return url.protocol === "https:" && !url.hostname.startsWith("localhost") && !url.hostname.startsWith("127.0.0.1");
    } catch {
      return true;
    }
  }

  return true;
}

export function isLocalTestSessionEnabled() {
  return process.env.NODE_ENV === "test" || process.env.E2E_LOCAL_SESSION === "1";
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
