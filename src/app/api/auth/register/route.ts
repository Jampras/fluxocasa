import { created, badRequest } from "@/server/http/response";
import { setSessionCookie } from "@/server/auth/session";
import { registerUser } from "@/server/services/auth.service";
import { registerSchema } from "@/server/validation/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { apiHandler } from "@/server/http/handler";

export const POST = apiHandler({
  auth: false,
  schema: registerSchema,
  handler: async ({ data }) => {
    if (await getSupabaseServerClient()) {
      return badRequest("Cadastro manual desativado. Use o login com Google.");
    }

    const user = await registerUser(data);
    await setSessionCookie(user.id);

    return created({
      message: "Conta criada com sucesso.",
      redirectTo: "/onboarding"
    });
  }
});
