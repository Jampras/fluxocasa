import { redirect } from "next/navigation";

import { ROUTES } from "@/config/routes";
import { redirectIfAuthenticated } from "@/server/auth/user";

export default async function CadastroPage() {
  await redirectIfAuthenticated();
  redirect(ROUTES.login);
}
