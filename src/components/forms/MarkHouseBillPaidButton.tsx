"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { refreshCurrentView } from "@/lib/app-refresh";
import { requestJson } from "@/lib/client-api";
import { cx } from "@/lib/utils";

export function MarkHouseBillPaidButton({
  billId,
  className
}: {
  billId: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);

    try {
      await requestJson(`/api/casa/contas/${billId}`, {
        method: "PATCH",
        body: JSON.stringify({})
      });

      refreshCurrentView(router, pathname, searchParams);
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
