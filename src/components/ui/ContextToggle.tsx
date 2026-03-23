"use client";

import type { Route } from "next";
import { motion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { Building2, User } from "lucide-react";
import { Suspense } from "react";

function ToggleContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const context = searchParams.get("scope") === "home" ? "home" : "personal";

  const setContext = (newContext: "personal" | "home") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("scope", newContext);
    router.push(`${pathname}?${params.toString()}` as Route, { scroll: false });
  };

  return (
    <div className="flex bg-white border-3 border-neo-dark shadow-neo p-1 w-full max-w-sm mb-8 mx-auto relative">
      <button
        onClick={() => setContext("personal")}
        className={twMerge(
          "flex-1 flex items-center justify-center gap-2 py-3 px-4 font-heading text-2xl transition-colors relative z-10",
          context === "personal" ? "text-neo-dark" : "text-gray-400 hover:text-neo-dark"
        )}
      >
        <User size={24} className="mb-1 stroke-[3px]" />
        PESSOAL
      </button>

      <button
        onClick={() => setContext("home")}
        className={twMerge(
          "flex-1 flex items-center justify-center gap-2 py-3 px-4 font-heading text-2xl transition-colors relative z-10",
          context === "home" ? "text-neo-dark" : "text-gray-400 hover:text-neo-dark"
        )}
      >
        <Building2 size={24} className="mb-1 stroke-[3px]" />
        CASA
      </button>

      {/* Active Indicator Slide */}
      <motion.div
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-neo-cyan border-3 border-neo-dark z-0"
        animate={{
          left: context === "personal" ? "4px" : "calc(50%)",
          backgroundColor: context === "personal" ? "#00E5FF" : "#FFD700" 
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />
    </div>
  );
}

export function ContextToggle() {
  return (
    <Suspense fallback={<div className="h-16 w-full max-w-sm bg-white border-3 border-neo-dark shadow-neo mx-auto mb-8 animate-pulse" />}>
      <ToggleContent />
    </Suspense>
  );
}
