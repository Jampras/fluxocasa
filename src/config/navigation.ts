import { CalendarDays, Home, Settings2, Target } from "lucide-react";

import { ROUTES } from "@/config/routes";

export const APP_NAVIGATION = [
  { href: ROUTES.dashboard, label: "Painel", icon: Home },
  { href: ROUTES.calendario, label: "Calendario", icon: CalendarDays },
  { href: ROUTES.metas, label: "Metas", icon: Target },
  { href: ROUTES.configuracoes, label: "Configuracoes", icon: Settings2 }
] as const;
