import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";

export function revalidateAppViews() {
  [
    ROUTES.dashboard,
    ROUTES.gerenciar,
    ROUTES.metas,
    ROUTES.configuracoes,
    ROUTES.moradores
  ].forEach((path) => {
    revalidatePath(path);
  });
}
