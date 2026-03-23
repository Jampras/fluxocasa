import { cache } from "react";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { ROUTES } from "@/config/routes";
import { prisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";

export const getOptionalCurrentUser = cache(async function getOptionalCurrentUser() {
  const supabase = await getSupabaseServerClient();

  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const whereClauses: Prisma.MoradorWhereInput[] = [{ authUserId: user.id }];

    if (user.email) {
      whereClauses.push({ email: user.email });
    }

    return prisma.morador.findFirst({
      where: {
        OR: whereClauses
      }
    });
  }

  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  return prisma.morador.findUnique({
    where: { id: userId }
  });
});

export const requireCurrentUser = cache(async function requireCurrentUser() {
  const user = await getOptionalCurrentUser();

  if (!user) {
    redirect(ROUTES.login);
  }

  return user;
});

export const requireCurrentResident = cache(async function requireCurrentResident() {
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
