import { badRequest, ok } from "@/server/http/response";
import { setSessionCookie } from "@/server/auth/session";
import { loginUser } from "@/server/services/auth.service";
import { loginSchema } from "@/server/validation/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiHandler } from "@/server/http/handler";

export const POST = apiHandler({
  auth: false,
  schema: loginSchema,
  handler: async ({ data }) => {
    if (await getSupabaseServerClient()) {
      return badRequest("Login por e-mail/senha desativado. Use o login com Google.");
    }

    const user = await loginUser(data);
    await setSessionCookie(user.id);

    return ok({
      message: "Sessao iniciada com sucesso.",
      redirectTo: user.casaId ? "/dashboard" : "/onboarding"
    });
  }
});
