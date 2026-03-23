import { redirect } from "next/navigation";

import { getOptionalCurrentUser } from "@/server/auth/user";

export default async function RootPage() {
  const user = await getOptionalCurrentUser();

  if (!user) {
    redirect("/login");
  }

  redirect(user.casaId ? "/dashboard" : "/onboarding");
}
