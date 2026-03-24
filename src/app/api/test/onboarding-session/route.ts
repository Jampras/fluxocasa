import { randomUUID } from "node:crypto";

import { created, forbidden } from "@/server/http/response";
import { setSessionCookie } from "@/server/auth/session";
import { isE2EBypassEnabled, setE2EBypassUserId } from "@/server/auth/e2e";
import { registerUser } from "@/server/services/auth.service";

export async function POST() {
  if (!isE2EBypassEnabled()) {
    return forbidden("Sessao de teste desativada.");
  }

  const suffix = randomUUID().slice(0, 8);
  const user = await registerUser({
    nome: `Onboarding E2E ${suffix}`,
    email: `onboarding+${suffix}@fluxocasa.test`,
    senha: "Fluxo123!"
  });

  await setSessionCookie(user.id);
  await setE2EBypassUserId(user.id);

  return created({
    message: "Sessao E2E de onboarding criada com sucesso.",
    redirectTo: "/onboarding"
  });
}
