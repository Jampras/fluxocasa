import { prisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { unauthorized } from "@/server/http/response";
import { getSessionUserId, isLocalTestSessionEnabled } from "@/server/auth/session";

export async function requireApiUser() {
  const supabase = await getSupabaseServerClient();

  if (supabase) {
    const {
      data: { user: authUser }
    } = await supabase.auth.getUser();

    if (authUser) {
      const user = await prisma.morador.findUnique({
        where: {
          authUserId: authUser.id
        }
      });

      if (!user) {
        return { error: unauthorized("Usuario nao encontrado.") };
      }

      return { user };
    }

    if (!isLocalTestSessionEnabled()) {
      return { error: unauthorized("Sessao invalida ou expirada.") };
    }
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
