import { prisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { unauthorized } from "@/server/http/response";
import { getSessionUserId } from "@/server/auth/session";
import type { Prisma } from "@prisma/client";

export async function requireApiUser() {
  const supabase = await getSupabaseServerClient();

  if (supabase) {
    const {
      data: { user: authUser }
    } = await supabase.auth.getUser();

    if (!authUser) {
      return { error: unauthorized("Sessao invalida ou expirada.") };
    }

    const whereClauses: Prisma.MoradorWhereInput[] = [{ authUserId: authUser.id }];

    if (authUser.email) {
      whereClauses.push({ email: authUser.email });
    }

    const user = await prisma.morador.findFirst({
      where: {
        OR: whereClauses
      }
    });

    if (!user) {
      return { error: unauthorized("Usuario nao encontrado.") };
    }

    return { user };
  }

  const userId = await getSessionUserId();

  if (!userId) {
    return { error: unauthorized("Sessao invalida ou expirada.") };
  }

  const user = await prisma.morador.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return { error: unauthorized("Usuario nao encontrado.") };
  }

  return { user };
}
