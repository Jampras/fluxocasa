"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { requestJson } from "@/lib/client-api";
import { Button } from "@/components/ui/Button";

interface LeaveHouseActionsProps {
  isAdmin: boolean;
  residentCount: number;
}

export function LeaveHouseActions({ isAdmin, residentCount }: LeaveHouseActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const canLeave = !isAdmin || residentCount === 1;
  const actionLabel = isAdmin && residentCount === 1 ? "Encerrar casa" : "Sair da casa";
  const confirmMessage =
    isAdmin && residentCount === 1
      ? "Encerrar a casa atual e remover seu vinculo?"
      : "Sair da casa atual agora?";

  async function handleLeaveHouse() {
    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) {
      return;
    }

    setPending(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await requestJson<{ message: string }>("/api/casa", {
        method: "DELETE"
      });

      setFeedback(response.message);
      startTransition(() => {
        router.push("/onboarding");
        router.refresh();
      });
    } catch (leaveError) {
      setError(leaveError instanceof Error ? leaveError.message : "Nao foi possivel concluir a saida da casa.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-none border-4 border-neo-dark bg-neo-bg p-4 sm:p-5">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-neo-dark sm:text-2xl">
          {isAdmin && residentCount === 1 ? "Encerrar casa" : "Sair da casa"}
        </h3>
        <p className="text-sm text-neo-dark/65">
          {canLeave
            ? "Use esta opcao para encerrar seu vinculo atual com a casa."
            : "Antes de sair, transfira a administracao para outro morador."}
        </p>
      </div>
      <Button
        type="button"
        variant={canLeave ? "ghost" : "secondary"}
        className={canLeave ? "border-[3px] border-neo-dark bg-white text-rose-700 sm:border-4" : ""}
        disabled={pending || !canLeave}
        onClick={() => void handleLeaveHouse()}
      >
        {pending ? "Processando..." : actionLabel}
      </Button>
      {feedback ? <p className="text-sm font-medium text-emerald-700">{feedback}</p> : null}
      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}
