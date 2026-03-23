import { Home, House, Lock, Users } from "lucide-react";

import { ROUTES } from "@/config/routes";

export const APP_NAVIGATION = [
  { href: ROUTES.dashboard, label: "Painel", icon: Home },
  { href: ROUTES.pessoal, label: "Pessoal", icon: Lock },
  { href: ROUTES.casa, label: "Casa", icon: House },
  { href: ROUTES.moradores, label: "Moradores", icon: Users }
] as const;
