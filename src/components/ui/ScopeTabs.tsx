"use client";

import { useCallback, useEffect } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const searchParams = useSearchParams();

  const buildHref = useCallback((scopeId: ScopeTabValue) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("scope", scopeId);
    const query = nextParams.toString();

    return (query ? `${pathname}?${query}` : pathname) as Route;
  }, [pathname, searchParams]);

  useEffect(() => {
    tabs.forEach((tab) => {
      void router.prefetch(buildHref(tab.id));
    });
  }, [buildHref, router, tabs]);

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {tabs.map((tab) => {
        const active = currentScope === tab.id;
        const href = buildHref(tab.id);

        return (
          <Link
            key={tab.id}
            href={href}
            prefetch
            scroll={false}
            onMouseEnter={() => {
              void router.prefetch(href);
            }}
            onTouchStart={() => {
              void router.prefetch(href);
            }}
            className={twMerge(
              "flex min-h-[78px] flex-col justify-center border-[3px] border-neo-dark bg-white px-2 py-2.5 text-center shadow-[4px_4px_0_#0F172A] transition-all sm:min-h-[96px] sm:border-4 sm:px-4 sm:py-3.5 sm:shadow-[5px_5px_0_#0F172A]",
              active
                ? "bg-neo-yellow -translate-y-1"
                : "hover:bg-neo-cyan hover:-translate-y-1"
            )}
          >
            <p className="font-heading text-lg uppercase leading-none text-neo-dark sm:text-2xl">{tab.label}</p>
            <p className="mt-1 font-body text-[9px] font-bold uppercase tracking-[0.08em] text-neo-dark/65 sm:text-xs sm:tracking-[0.16em]">
              {tab.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
