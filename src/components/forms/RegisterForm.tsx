"use client";

import type { FormEvent } from "react";
import type { Route } from "next";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { GoogleAuthButton } from "@/components/forms/GoogleAuthButton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ROUTES } from "@/config/routes";
import { requestJson } from "@/lib/client-api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const supabase = getSupabaseBrowserClient();

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    try {
      const result = await requestJson<{ redirectTo?: Route }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          nome: formData.get("nome"),
          email: formData.get("email"),
          senha: formData.get("senha")
        })
      });

      startTransition(() => {
        router.push(result.redirectTo || ROUTES.onboarding);
        router.refresh();
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Falha ao criar a conta.");
    } finally {
      setPending(false);
    }
  }

  if (supabase) {
    return (
      <div className="grid gap-4">
        <p className="text-sm text-neo-dark/70">
          A conta e criada no primeiro login com Google. Depois disso voce segue para a configuracao da casa.
        </p>
        <GoogleAuthButton mode="register" />
      </div>
    );
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void handleSubmit(new FormData(event.currentTarget));
      }}
    >
      <Input id="nome" name="nome" label="Nome" placeholder="Joao" />
      <Input id="email" name="email" label="E-mail" placeholder="voce@email.com" type="email" />
      <Input id="senha" name="senha" label="Senha" placeholder="Crie uma senha" type="password" />
      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
      <Button fullWidth disabled={pending}>
        {pending ? "Criando..." : "Criar conta"}
      </Button>
    </form>
  );
}
