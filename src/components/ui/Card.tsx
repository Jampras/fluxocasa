import type { HTMLAttributes } from "react";

import { cx } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "border-[3px] border-neo-dark bg-[linear-gradient(180deg,rgba(255,246,232,0.98)_0%,rgba(255,239,219,0.99)_100%)] p-4 shadow-[4px_4px_0_#0F172A] transition-transform duration-150 hover:-translate-y-1 sm:border-4 sm:p-4 sm:shadow-[5px_5px_0_#0F172A] md:p-5 md:shadow-[6px_6px_0_#0F172A]",
        className
      )}
      {...props}
    />
  );
}
