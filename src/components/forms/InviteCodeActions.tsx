"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { requestJson } from "@/lib/client-api";
import { Button } from "@/components/ui/Button";

interface InviteCodeActionsProps {
  inviteCode: string;
  canRotate: boolean;
}

export function InviteCodeActions({ inviteCode, canRotate }: InviteCodeActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState<"copy" | "rotate" | null>(null);

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function copyInviteCode() {
    setLoading("copy");
    setError(null);

    try {
      await navigator.clipboard.writeText(inviteCode);
      setFeedback("Codigo copiado.");
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : "Nao foi possivel copiar o codigo.");
    } finally {
      setLoading(null);
    }
  }

  async function rotateCode() {
    setLoading("rotate");
    setError(null);
    setFeedback(null);

    try {
      const response = await requestJson<{ inviteCode: string; message: string }>("/api/casa/convite", {
        method: "PATCH"
      });

      setFeedback(response.message);
      refresh();
    } catch (rotateError) {
      setError(
        rotateError instanceof Error ? rotateError.message : "Nao foi possivel gerar um novo codigo."
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => void copyInviteCode()} disabled={loading === "copy"}>
          {loading === "copy" ? "Copiando..." : "Copiar codigo"}
        </Button>
        {canRotate ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => void rotateCode()}
            disabled={loading === "rotate"}
          >
            {loading === "rotate" ? "Atualizando..." : "Gerar novo codigo"}
          </Button>
        ) : null}
      </div>
      {feedback ? <p className="text-sm font-medium text-emerald-700">{feedback}</p> : null}
      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
      {!canRotate ? (
        <p className="text-sm text-neo-dark/55">Apenas administradores podem regenerar o codigo de convite.</p>
      ) : null}
    </div>
  );
}
