"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { GoogleAuthButton } from "@/components/forms/GoogleAuthButton";

export function LoginForm() {
  const supabase = getSupabaseBrowserClient();

  if (supabase) {
    return (
      <div className="grid gap-6 border-4 border-neo-dark bg-white p-8 shadow-[4px_4px_0_#0F172A]">
        <p className="text-center font-body text-xl font-bold uppercase text-neo-dark">
          Use sua conta Google. Voce entra e segue para o painel ou onboarding.
        </p>
        <GoogleAuthButton />
      </div>
    );
  }

  return (
    <div className="grid gap-6 border-4 border-neo-dark bg-white p-8 shadow-[6px_6px_0_#0F172A]">
      <div className="border-4 border-neo-dark bg-neo-pink p-4 text-center font-body text-lg font-bold uppercase text-white">
        Login manual desativado. Configure o Supabase para usar Google.
      </div>
    </div>
  );
}
