"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { ROUTES } from "@/config/routes";
import { requestJson } from "@/lib/client-api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);

    try {
      const supabase = getSupabaseBrowserClient();

      if (supabase) {
        await supabase.auth.signOut();
      } else {
        await requestJson("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
      }
    } finally {
      startTransition(() => {
        router.push(ROUTES.login);
        router.refresh();
      });
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleLogout();
      }}
      aria-label={pending ? "Saindo da conta" : "Sair da conta"}
      title={pending ? "Saindo da conta" : "Sair da conta"}
      className="neo-pressable flex h-12 w-12 items-center justify-center gap-2 border-[3px] border-neo-dark bg-neo-pink px-0 py-0 font-heading text-base uppercase tracking-[0.18em] text-white shadow-[3px_3px_0_#0F172A] sm:h-14 sm:w-14 sm:border-4 sm:text-lg sm:shadow-[4px_4px_0_#0F172A] md:h-auto md:w-auto md:px-5 md:py-3 md:text-2xl"
      disabled={pending}
    >
      {pending ? (
        <span className="text-[10px] sm:text-xs md:text-base">...</span>
      ) : (
        <>
          <LogOut size={20} className="stroke-[3px] sm:h-6 sm:w-6" />
          <span className="hidden md:inline">SAIR</span>
        </>
      )}
    </button>
  );
}
