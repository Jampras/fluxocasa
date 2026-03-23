import type { HTMLAttributes } from "react";

import { cx } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "border-4 border-neo-dark bg-white shadow-[6px_6px_0_#0F172A] p-6",
        className
      )}
      {...props}
    />
  );
}
