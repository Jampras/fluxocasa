"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { requestJson } from "@/lib/client-api";
import { Button } from "@/components/ui/Button";

interface ResidentManagementActionsProps {
  residentId: string;
  residentName: string;
}

export function ResidentManagementActions({
  residentId,
  residentName
}: ResidentManagementActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState<"transfer" | "remove" | null>(null);

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function transferAdmin() {
    setLoading("transfer");
    setError(null);
    setFeedback(null);

    try {
      const response = await requestJson<{ message: string }>(`/api/moradores/${residentId}/admin`, {
        method: "PATCH"
      });

      setFeedback(response.message);
      refresh();
    } catch (transferError) {
      setError(
        transferError instanceof Error
          ? transferError.message
          : "Nao foi possivel transferir a administracao."
      );
    } finally {
      setLoading(null);
    }
  }

  async function removeResident() {
    const confirmed = window.confirm(`Remover ${residentName} da casa atual?`);

    if (!confirmed) {
      return;
    }

    setLoading("remove");
    setError(null);
    setFeedback(null);

    try {
      const response = await requestJson<{ message: string }>(`/api/moradores/${residentId}`, {
        method: "DELETE"
      });

      setFeedback(response.message);
      refresh();
    } catch (removeError) {
      setError(
        removeError instanceof Error ? removeError.message : "Nao foi possivel remover o morador."
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-none bg-neo-bg border-4 border-neo-dark  p-4">
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => void transferAdmin()}
          disabled={loading !== null}
        >
          {loading === "transfer" ? "Transferindo..." : "Transferir admin"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-rose-700"
          onClick={() => void removeResident()}
          disabled={loading !== null}
        >
          {loading === "remove" ? "Removendo..." : "Remover"}
        </Button>
      </div>
      {feedback ? <p className="text-sm font-medium text-emerald-700">{feedback}</p> : null}
      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}
