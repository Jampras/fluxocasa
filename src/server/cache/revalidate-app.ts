import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";

export function revalidateAppViews() {
  [
    ROUTES.dashboard,
    ROUTES.gerenciar,
    ROUTES.calendario,
    ROUTES.metas,
    ROUTES.configuracoes,
    ROUTES.casa,
    ROUTES.pessoal,
    ROUTES.moradores
  ].forEach((path) => {
    revalidatePath(path);
  });
}
