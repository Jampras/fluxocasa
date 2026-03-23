"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { twMerge } from "tailwind-merge";

type ScopeTabValue = "geral" | "casa" | "pessoal";

export function ScopeTabs({
  currentScope,
  tabs
}: {
  currentScope: ScopeTabValue;
  tabs: Array<{
    id: ScopeTabValue;
    label: string;
    description: string;
  }>;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {tabs.map((tab) => {
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set("scope", tab.id);
        const active = currentScope === tab.id;

        return (
          <Link
            key={tab.id}
            href={{
              pathname,
              query: Object.fromEntries(nextParams.entries())
            }}
            className={twMerge(
              "border-4 border-neo-dark bg-white px-5 py-4 shadow-[6px_6px_0_#0F172A] transition-all",
              active
                ? "bg-neo-yellow -translate-y-1"
                : "hover:bg-neo-cyan hover:-translate-y-1"
            )}
          >
            <p className="font-heading text-2xl uppercase text-neo-dark">{tab.label}</p>
            <p className="mt-1 font-body text-sm font-bold uppercase tracking-[0.18em] text-neo-dark/65">
              {tab.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
