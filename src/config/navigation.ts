import { FolderKanban, Home, Settings2, Target } from "lucide-react";

import { ROUTES } from "@/config/routes";

export const APP_NAVIGATION = [
  { href: ROUTES.dashboard, label: "Painel", icon: Home },
  { href: ROUTES.gerenciar, label: "Gerenciar", icon: FolderKanban },
  { href: ROUTES.metas, label: "Metas", icon: Target },
  { href: ROUTES.configuracoes, label: "Configuracoes", icon: Settings2 }
] as const;
