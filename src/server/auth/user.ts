import { redirect } from "next/navigation";

import { ROUTES } from "@/config/routes";
import { prisma } from "@/lib/prisma";
import { safeCache } from "@/lib/safe-cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId, isLocalTestSessionEnabled } from "@/server/auth/session";

export const getOptionalCurrentUser = safeCache(async function getOptionalCurrentUser() {
  const supabase = await getSupabaseServerClient();

  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      return prisma.morador.findUnique({
        where: {
          authUserId: user.id
        }
      });
    }

    if (!isLocalTestSessionEnabled()) {
      return null;
    }
  }

  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  return prisma.morador.findUnique({
    where: { id: userId }
  });
});

export const requireCurrentUser = safeCache(async function requireCurrentUser() {
  const user = await getOptionalCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  return user;
});

export const requireCurrentResident = safeCache(async function requireCurrentResident() {
  const user = await requireCurrentUser();

  if (!user.casaId) {
    redirect(ROUTES.onboarding);
  }

  return user;
});

export async function redirectIfAuthenticated() {
  const user = await getOptionalCurrentUser();

  if (!user) {
    return;
  }

  redirect(user.casaId ? ROUTES.dashboard : ROUTES.onboarding);
}
