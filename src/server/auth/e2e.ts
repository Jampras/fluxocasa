import { cookies, headers } from "next/headers";

export const E2E_BYPASS_COOKIE = "fluxocasa_e2e_user";

export function isE2EBypassEnabled() {
  return process.env.E2E_BYPASS_AUTH === "1";
}

export async function getE2EBypassUserId() {
  if (!isE2EBypassEnabled()) {
    return null;
  }

  const cookieStore = await cookies();
  return cookieStore.get(E2E_BYPASS_COOKIE)?.value ?? null;
}

export async function setE2EBypassUserId(userId: string) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "";
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const secure =
    !host.startsWith("localhost") &&
    !host.startsWith("127.0.0.1") &&
    (forwardedProto ? forwardedProto === "https" : process.env.NODE_ENV === "production");

  cookieStore.set(E2E_BYPASS_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60
  });
}
