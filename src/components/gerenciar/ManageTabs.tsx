"use client";

import { useCallback, useEffect } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { twMerge } from "tailwind-merge";

type ManageTab = "casa" | "pessoal";

const MANAGE_TABS: Array<{ id: ManageTab; label: string }> = [
  { id: "casa", label: "Casa" },
  { id: "pessoal", label: "Pessoal" }
];

export function ManageTabs({ currentTab }: { currentTab: ManageTab }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const buildHref = useCallback((tabId: ManageTab) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", tabId);
    nextParams.delete("focus");

    const query = nextParams.toString();

    return (query ? `${pathname}?${query}` : pathname) as Route;
  }, [pathname, searchParams]);

  useEffect(() => {
    MANAGE_TABS.forEach((tab) => {
      void router.prefetch(buildHref(tab.id));
    });
  }, [buildHref, router]);

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {MANAGE_TABS.map((tab) => {
        const active = currentTab === tab.id;
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
              "neo-pressable flex min-h-[58px] items-center justify-center border-[3px] border-neo-dark bg-neo-cream px-3 py-2.5 text-center shadow-[4px_4px_0_#0F172A] sm:min-h-[72px] sm:border-4 sm:px-4 sm:py-3 sm:shadow-[5px_5px_0_#0F172A]",
              active ? "neo-tab-active bg-neo-yellow -translate-y-1" : "hover:bg-neo-cyan"
            )}
          >
            <p className="font-heading text-lg uppercase leading-none text-neo-dark sm:text-2xl">{tab.label}</p>
          </Link>
        );
      })}
    </div>
  );
}
