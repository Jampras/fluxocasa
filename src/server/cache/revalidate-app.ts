import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";

const REVALIDATION_PRESETS = {
  dashboard: [ROUTES.dashboard],
  gerenciar: [ROUTES.gerenciar],
  anotacoes: [ROUTES.anotacoes],
  configuracoes: [ROUTES.configuracoes, ROUTES.moradores],
  personal: [ROUTES.dashboard, ROUTES.gerenciar],
  house: [ROUTES.dashboard, ROUTES.gerenciar],
  settings: [ROUTES.dashboard, ROUTES.gerenciar, ROUTES.anotacoes, ROUTES.configuracoes, ROUTES.moradores],
  membership: [
    ROUTES.dashboard,
    ROUTES.gerenciar,
    ROUTES.anotacoes,
    ROUTES.configuracoes,
    ROUTES.moradores
  ],
  all: [
    ROUTES.dashboard,
    ROUTES.gerenciar,
    ROUTES.anotacoes,
    ROUTES.configuracoes,
    ROUTES.moradores
  ]
} as const;

type RevalidationTarget = keyof typeof REVALIDATION_PRESETS;

export function revalidateAppViews(targets: RevalidationTarget[] = ["all"]) {
  const paths = new Set<string>();

  targets.forEach((target) => {
    REVALIDATION_PRESETS[target].forEach((path) => {
      paths.add(path);
    });
  });

  paths.forEach((path) => {
    revalidatePath(path);
  });
}
