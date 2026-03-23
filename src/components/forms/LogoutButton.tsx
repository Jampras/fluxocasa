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
      className="flex items-center justify-center gap-2 border-4 border-neo-dark bg-neo-pink px-4 py-2 font-heading text-xl uppercase tracking-wider text-white shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_#0F172A] active:translate-y-1 md:px-6 md:py-3 md:text-2xl"
      disabled={pending}
    >
      {pending ? (
        "SAINDO..."
      ) : (
        <>
          <LogOut size={24} className="stroke-[3px]" />
          <span className="hidden md:inline">SAIR</span>
        </>
      )}
    </button>
  );
}
