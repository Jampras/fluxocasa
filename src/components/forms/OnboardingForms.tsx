"use client";

import type { FormEvent } from "react";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/config/routes";
import { requestJson } from "@/lib/client-api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function OnboardingForms() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  function navigateToDashboard() {
    startTransition(() => {
      router.push(ROUTES.dashboard);
      router.refresh();
    });
  }

  async function handleCreate(formData: FormData) {
    setCreating(true);
    setError(null);

    try {
      await requestJson("/api/onboarding/create-house", {
        method: "POST",
        body: JSON.stringify({
          nome: formData.get("nome")
        })
      });

      navigateToDashboard();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Nao foi possivel criar a casa."
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(formData: FormData) {
    setJoining(true);
    setError(null);

    try {
      await requestJson("/api/onboarding/join-house", {
        method: "POST",
        body: JSON.stringify({
          codigoConvite: formData.get("codigoConvite")
        })
      });

      navigateToDashboard();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Nao foi possivel entrar na casa."
      );
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        className="grid gap-4"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          void handleCreate(new FormData(event.currentTarget));
        }}
      >
        <Input id="nome" name="nome" label="Nome da casa" placeholder="Apartamento 42" />
        <Button fullWidth disabled={creating}>
          {creating ? "Criando..." : "Criar casa"}
        </Button>
      </form>

      <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.22em] text-neo-dark/35">
        <span className="h-px flex-1 bg-ink/10" />
        ou
        <span className="h-px flex-1 bg-ink/10" />
      </div>

      <form
        className="grid gap-4"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          void handleJoin(new FormData(event.currentTarget));
        }}
      >
        <Input
          id="codigoConvite"
          name="codigoConvite"
          label="Codigo de convite"
          placeholder="FLUXO-7X3K"
        />
        <Button variant="secondary" fullWidth disabled={joining}>
          {joining ? "Entrando..." : "Entrar com convite"}
        </Button>
      </form>

      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}
