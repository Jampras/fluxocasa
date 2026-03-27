"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { refreshCurrentView } from "@/lib/app-refresh";
import { requestJson } from "@/lib/client-api";
import { Button } from "@/components/ui/Button";
import { ActionFeedback } from "@/components/ui/ActionFeedback";

interface InviteCodeActionsProps {
  inviteCode: string;
  canRotate: boolean;
}

export function InviteCodeActions({ inviteCode, canRotate }: InviteCodeActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState<"copy" | "rotate" | null>(null);

  useEffect(() => {
    if (!error && !feedback) {
      return;
    }

    const handle = window.setTimeout(() => {
      setError(null);
      setFeedback(null);
    }, 3200);

    return () => window.clearTimeout(handle);
  }, [error, feedback]);

  function refresh() {
    refreshCurrentView(router, pathname, searchParams);
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
      {feedback ? (
        <ActionFeedback
          tone="success"
          message={feedback}
          onDismiss={() => setFeedback(null)}
        />
      ) : null}
      {error ? (
        <ActionFeedback
          tone="error"
          message={error}
          onDismiss={() => setError(null)}
        />
      ) : null}
      {!canRotate ? (
        <p className="text-sm text-neo-dark/55">Apenas administradores podem regenerar o codigo de convite.</p>
      ) : null}
    </div>
  );
}
