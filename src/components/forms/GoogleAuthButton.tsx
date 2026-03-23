"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { NeoButton } from "@/components/ui/NeoButton";
import { getPublicEnv } from "@/config/env";

interface GoogleAuthButtonProps {
  mode: "login" | "register";
}

export function GoogleAuthButton({ mode }: GoogleAuthButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { NEXT_PUBLIC_APP_URL: appUrl } = getPublicEnv();

  async function handleGoogleAuth() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase nao configurado. Revise as variaveis de ambiente.");
      return;
    }

    const redirectBaseUrl = appUrl?.replace(/\/$/, "") || window.location.origin;

    setPending(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${redirectBaseUrl}/auth/callback`
      }
    });
    if (authError) {
      setError(authError.message);
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4">
      <NeoButton type="button" disabled={pending} onClick={() => void handleGoogleAuth()} className="w-full py-4 text-2xl flex items-center justify-center gap-3 bg-white border-4 border-neo-dark hover:bg-neo-yellow text-neo-dark shadow-[4px_4px_0_#0F172A]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-8 h-8">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {pending
          ? "REDIRECIONANDO..."
          : mode === "login"
            ? "ENTRAR COM GOOGLE"
            : "CRIAR COM GOOGLE"}
      </NeoButton>
      {error ? <div className="bg-neo-pink text-white font-bold p-3 border-4 border-neo-dark text-center">{error}</div> : null}
    </div>
  );
}
