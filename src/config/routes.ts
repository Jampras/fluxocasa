import type { Route } from "next";

export const ROUTES = {
  home: "/" as Route,
  login: "/login" as Route,
  cadastro: "/cadastro" as Route,
  onboarding: "/onboarding" as Route,
  dashboard: "/dashboard" as Route,
  casa: "/casa" as Route,
  pessoal: "/pessoal" as Route,
  moradores: "/moradores" as Route
};

export const APP_ROUTE_LIST = [
  ROUTES.dashboard,
  ROUTES.pessoal,
  ROUTES.casa,
  ROUTES.moradores
] as const;

