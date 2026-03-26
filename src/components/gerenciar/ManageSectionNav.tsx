"use client";

import Link from "next/link";

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
  return (
    <div className="space-y-2 sm:space-y-3">
      {title ? (
        <p className="font-heading text-[10px] uppercase tracking-[0.18em] text-neo-pink sm:text-sm sm:tracking-[0.26em]">
          {title}
        </p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`#${item.id}`}
            className="neo-pressable inline-flex min-h-[54px] items-center justify-center border-[3px] border-neo-dark bg-white px-3 py-2.5 text-center font-heading text-sm uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] hover:bg-neo-yellow sm:min-h-[58px] sm:border-4 sm:px-4 sm:text-base"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
