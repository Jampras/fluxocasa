import { randomUUID } from "node:crypto";

import { created, forbidden } from "@/server/http/response";
import { setSessionCookie } from "@/server/auth/session";
import { setE2EBypassUserId, isE2EBypassEnabled } from "@/server/auth/e2e";
import { registerUser } from "@/server/services/auth.service";
import { createHouseForUser } from "@/server/services/house.service";

export async function POST() {
  if (!(await isE2EBypassEnabled())) {
    return forbidden("Sessao de teste desativada.");
  }

  const suffix = randomUUID().slice(0, 8);
  const user = await registerUser({
    nome: `Teste E2E ${suffix}`,
    email: `e2e+${suffix}@fluxocasa.test`,
    senha: "Fluxo123!"
  });

  await createHouseForUser(user.id, `Casa E2E ${suffix}`);
  await setSessionCookie(user.id);
  await setE2EBypassUserId(user.id);

  return created({
    message: "Sessao E2E criada com sucesso.",
    redirectTo: "/dashboard"
  });
}
