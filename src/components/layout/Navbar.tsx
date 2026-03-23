"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAVIGATION } from "@/config/navigation";
import { twMerge } from "tailwind-merge";

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Nav Neo-Brutalism */}
      <div className="fixed inset-x-0 bottom-0 z-40 w-full md:hidden bg-neo-lime border-t-4 border-neo-dark pb-safe">
        <nav className="w-full px-2 py-3">
          <ul className="flex items-center justify-around w-full">
            {APP_NAVIGATION.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <li key={item.href} className="flex-1 flex justify-center px-1">
                  <Link
                    href={item.href}
                    className={twMerge(
                      "flex flex-col items-center justify-center p-3 border-4 border-neo-dark rounded-none transition-transform bg-white w-full",
                      active
                        ? "shadow-[4px_4px_0_#0F172A] -translate-y-1 bg-neo-yellow"
                        : "hover:bg-neo-cyan active:translate-y-1 active:shadow-none"
                    )}
                  >
                    <Icon className="h-6 w-6 stroke-[3px] text-neo-dark" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Desktop Sidebar Neo-Brutalism */}
      <aside className="hidden md:flex flex-col w-72 shrink-0 border-r-4 border-neo-dark bg-neo-pink p-8 min-h-screen sticky top-0 shadow-[8px_0_0_#0F172A] z-20">
        <div className="mb-16 flex items-center justify-center gap-4 bg-white p-4 border-4 border-neo-dark shadow-[4px_4px_0_#0F172A] rotate-[-2deg]">
          <h1 className="font-heading text-4xl text-neo-dark uppercase m-0 leading-none">FLUXO</h1>
        </div>
        <ul className="flex flex-col gap-6">
          {APP_NAVIGATION.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={twMerge(
                    "flex items-center gap-4 px-6 py-4 font-heading text-2xl uppercase border-4 border-neo-dark transition-all",
                    active 
                      ? "bg-neo-yellow shadow-[6px_6px_0_#0F172A] -translate-y-1 text-neo-dark" 
                      : "bg-white text-neo-dark hover:bg-neo-cyan hover:-translate-y-1 hover:shadow-[4px_4px_0_#0F172A] active:translate-y-1 active:shadow-none"
                  )}
                >
                  <Icon className="h-6 w-6 stroke-[3px]" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}
