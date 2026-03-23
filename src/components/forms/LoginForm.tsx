"use client";

import type { FormEvent } from "react";
import type { Route } from "next";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/config/routes";
import { requestJson } from "@/lib/client-api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { GoogleAuthButton } from "@/components/forms/GoogleAuthButton";
import { NeoButton } from "@/components/ui/NeoButton";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const supabase = getSupabaseBrowserClient();

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    try {
      const result = await requestJson<{ redirectTo?: Route }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: formData.get("email"),
          senha: formData.get("senha")
        })
      });

      startTransition(() => {
        router.push(result.redirectTo || ROUTES.dashboard);
        router.refresh();
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Acesso negado.");
    } finally {
      setPending(false);
    }
  }

  if (supabase) {
    return (
      <div className="grid gap-6 border-4 border-neo-dark bg-white p-8 shadow-[4px_4px_0_#0F172A]">
        <p className="text-center font-body text-xl font-bold uppercase text-neo-dark">
          Use sua conta Google. Voce entra e segue para o painel ou onboarding.
        </p>
        <GoogleAuthButton mode="login" />
      </div>
    );
  }

  return (
    <form
      className="grid gap-6 border-4 border-neo-dark bg-white p-8 shadow-[6px_6px_0_#0F172A]"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void handleSubmit(new FormData(event.currentTarget));
      }}
    >
      <div className="grid gap-2">
        <label className="font-heading text-2xl uppercase text-neo-dark" htmlFor="email">
          E-mail
        </label>
        <input
          autoFocus
          id="email"
          name="email"
          type="email"
          placeholder="voce@email.com"
          className="w-full border-4 border-neo-dark bg-neo-bg p-4 font-body text-xl font-bold outline-none transition-colors placeholder:text-neo-dark/30 focus:bg-neo-yellow"
        />
      </div>

      <div className="grid gap-2">
        <label className="font-heading text-2xl uppercase text-neo-dark" htmlFor="senha">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          placeholder="********"
          className="w-full border-4 border-neo-dark bg-neo-bg p-4 font-body text-xl font-bold outline-none transition-colors placeholder:text-neo-dark/30 focus:bg-neo-pink focus:text-white"
        />
      </div>

      {error ? (
        <div className="border-4 border-neo-dark bg-neo-pink p-3 text-center font-bold text-white">
          {error}
        </div>
      ) : null}

      <NeoButton disabled={pending} className="mt-2 w-full py-6 text-3xl shadow-[4px_4px_0_#0F172A]">
        {pending ? "ENTRANDO..." : "ENTRAR"}
      </NeoButton>
    </form>
  );
}
