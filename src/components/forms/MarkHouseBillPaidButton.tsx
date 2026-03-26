"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { refreshCurrentView } from "@/lib/app-refresh";
import { requestJson } from "@/lib/client-api";
import { cx } from "@/lib/utils";

export function MarkHouseBillPaidButton({
  billId,
  className,
  onSuccess,
  skipRefresh = false
}: {
  billId: string;
  className?: string;
  onSuccess?: () => void;
  skipRefresh?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleClick() {
    setPending(true);
    setStatus("idle");

    try {
      await requestJson(`/api/casa/contas/${billId}`, {
        method: "PATCH",
        body: JSON.stringify({})
      });

      setStatus("success");
      onSuccess?.();

      if (!skipRefresh) {
        refreshCurrentView(router, pathname, searchParams, { delayMs: 220 });
      }
    } catch {
      setStatus("error");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleClick();
      }}
      className={cx(
        "mt-2 text-xs font-semibold uppercase tracking-[0.18em]",
        status === "success"
          ? "text-emerald-700"
          : status === "error"
            ? "text-rose-700"
            : "text-neo-dark",
        className
      )}
      disabled={pending}
    >
      {pending
        ? "Processando..."
        : status === "success"
          ? "Conta paga"
          : status === "error"
            ? "Tentar de novo"
            : "Marcar como paga"}
    </button>
  );
}
