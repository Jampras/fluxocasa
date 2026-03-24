import type { Route } from "next";

export const ROUTES = {
  home: "/" as Route,
  login: "/login" as Route,
  cadastro: "/cadastro" as Route,
  onboarding: "/onboarding" as Route,
  dashboard: "/dashboard" as Route,
  gerenciar: "/gerenciar" as Route,
  calendario: "/calendario" as Route,
  metas: "/metas" as Route,
  configuracoes: "/configuracoes" as Route,
  casa: "/casa" as Route,
  pessoal: "/pessoal" as Route,
  moradores: "/moradores" as Route
};

export const APP_ROUTE_LIST = [
  ROUTES.dashboard,
  ROUTES.gerenciar,
  ROUTES.metas,
  ROUTES.configuracoes
] as const;
