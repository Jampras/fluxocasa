import { cookies, headers } from "next/headers";

export const E2E_BYPASS_COOKIE = "fluxocasa_e2e_user";

function isLocalE2EHost(host: string) {
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

export async function isE2EBypassEnabled() {
  if (process.env.E2E_BYPASS_AUTH !== "1") {
    return false;
  }

  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost ?? headerStore.get("host") ?? "";

  return isLocalE2EHost(host);
}

export async function getE2EBypassUserId() {
  if (!(await isE2EBypassEnabled())) {
    return null;
  }

  const cookieStore = await cookies();
  return cookieStore.get(E2E_BYPASS_COOKIE)?.value ?? null;
}

export async function setE2EBypassUserId(userId: string) {
  if (!(await isE2EBypassEnabled())) {
    return;
  }

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
