import { NextResponse } from "next/server";

import { ROUTES } from "@/config/routes";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { syncAuthenticatedUser } from "@/server/services/auth.service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const loginUrl = new URL(ROUTES.login, url.origin);

  if (!code) {
    loginUrl.searchParams.set("error", "oauth_callback");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    loginUrl.searchParams.set("error", "supabase_env");
    return NextResponse.redirect(loginUrl);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    loginUrl.searchParams.set("error", "oauth_exchange");
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    loginUrl.searchParams.set("error", "oauth_user");
    return NextResponse.redirect(loginUrl);
  }

  const nome =
    user.user_metadata.full_name ||
    user.user_metadata.name ||
    user.email.split("@")[0] ||
    "Morador";

  const appUser = await syncAuthenticatedUser({
    authUserId: user.id,
    email: user.email,
    nome
  });

  return NextResponse.redirect(new URL(appUser.casaId ? ROUTES.dashboard : ROUTES.onboarding, url.origin));
}
