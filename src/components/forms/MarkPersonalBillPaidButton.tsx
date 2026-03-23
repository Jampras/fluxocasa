"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { requestJson } from "@/lib/client-api";
import { cx } from "@/lib/utils";

export function MarkPersonalBillPaidButton({
  billId,
  className
}: {
  billId: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);

    try {
      await requestJson(`/api/pessoal/contas/${billId}`, {
        method: "PATCH",
        body: JSON.stringify({})
      });

      startTransition(() => {
        router.refresh();
      });
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
      className={cx("mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-neo-dark", className)}
      disabled={pending}
    >
      {pending ? "Processando..." : "Marcar como paga"}
    </button>
  );
}
