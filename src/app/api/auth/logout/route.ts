import { ok } from "@/server/http/response";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { clearSessionCookie } from "@/server/auth/session";
import { apiHandler } from "@/server/http/handler";

export const POST = apiHandler({
  auth: false,
  csrf: true,
  handler: async () => {
    const supabase = await getSupabaseServerClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    await clearSessionCookie();

    return ok({ message: "Sessao encerrada." });
  }
});
