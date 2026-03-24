import type { HTMLAttributes } from "react";

import { cx } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "border-[3px] border-neo-dark bg-white p-4 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:p-5 sm:shadow-[5px_5px_0_#0F172A] md:p-6 md:shadow-[6px_6px_0_#0F172A]",
        className
      )}
      {...props}
    />
  );
}
