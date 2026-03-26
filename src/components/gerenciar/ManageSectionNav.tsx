"use client";

import Link from "next/link";
import { twMerge } from "tailwind-merge";

type ManageSectionItem = {
  id: string;
  label: string;
};

export function ManageSectionNav({
  title,
  items
}: {
  title?: string;
  items: ManageSectionItem[];
}) {
  const desktopColumnsClass = items.length >= 6 ? "xl:grid-cols-6" : "xl:grid-cols-5";

  return (
    <div className="space-y-2 sm:space-y-3">
      {title ? (
        <p className="font-heading text-[10px] uppercase tracking-[0.18em] text-neo-pink sm:text-sm sm:tracking-[0.26em]">
          {title}
        </p>
      ) : null}
      <div className={twMerge("grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:gap-4", desktopColumnsClass)}>
        {items.map((item, index) => (
          <Link
            key={item.id}
            href={`#${item.id}`}
            className={twMerge(
              "neo-pressable inline-flex min-h-[54px] items-center justify-center border-[3px] border-neo-dark bg-white px-3 py-2.5 text-center font-heading text-sm uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] sm:min-h-[58px] sm:border-4 sm:px-4 sm:text-base xl:min-h-[62px] xl:px-5 xl:text-lg",
              index % 3 === 0
                ? "hover:bg-neo-yellow"
                : index % 3 === 1
                  ? "hover:bg-neo-cyan"
                  : "hover:bg-neo-lime"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
