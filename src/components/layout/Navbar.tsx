"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAVIGATION } from "@/config/navigation";
import { twMerge } from "tailwind-merge";

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 w-full border-t-[3px] border-neo-dark bg-neo-lime/95 pb-safe backdrop-blur-sm md:hidden">
        <nav className="w-full px-2 py-2">
          <ul className="flex items-center justify-around w-full">
            {APP_NAVIGATION.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <li key={item.href} className="flex flex-1 justify-center px-1">
                  <Link
                    href={item.href}
                    className={twMerge(
                      "flex min-h-[60px] w-full flex-col items-center justify-center gap-1 border-[3px] border-neo-dark bg-white px-2 py-2 transition-transform",
                      active
                        ? "-translate-y-1 bg-neo-yellow shadow-[4px_4px_0_#0F172A]"
                        : "hover:bg-neo-cyan active:translate-y-1 active:shadow-none"
                    )}
                  >
                    <Icon className="h-5 w-5 stroke-[2.8px] text-neo-dark" />
                    <span className="font-body text-[9px] font-black uppercase tracking-[0.12em] text-neo-dark">
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <aside className="sticky top-0 z-20 hidden min-h-screen w-64 shrink-0 flex-col border-r-4 border-neo-dark bg-neo-pink p-6 shadow-[8px_0_0_#0F172A] md:flex xl:w-[272px] xl:p-8">
        <div className="mb-12 flex items-center justify-center gap-4 border-4 border-neo-dark bg-white p-4 shadow-[4px_4px_0_#0F172A] rotate-[-2deg] xl:mb-16">
          <h1 className="m-0 font-heading text-4xl leading-none text-neo-dark uppercase">FLUXO.CASA</h1>
        </div>
        <ul className="flex flex-col gap-4 xl:gap-6">
          {APP_NAVIGATION.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={twMerge(
                    "flex items-center gap-3 border-4 border-neo-dark px-5 py-3 font-heading text-xl uppercase transition-all xl:gap-4 xl:px-6 xl:py-4 xl:text-2xl",
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
