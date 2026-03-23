import type { HTMLAttributes } from "react";

import type { Tone } from "@/types";
import { cx } from "@/lib/utils";

const toneMap: Record<Tone | "primary", string> = {
  emerald: "bg-neo-lime text-neo-dark",
  zinc: "bg-white text-neo-dark",
  amber: "bg-neo-yellow text-neo-dark",
  slate: "bg-white text-neo-dark",
  danger: "bg-neo-pink text-white",
  success: "bg-neo-lime text-neo-dark",
  primary: "bg-neo-cyan text-neo-dark"
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone | "primary";
}

export function Badge({ className, tone = "primary", ...props }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center px-4 py-1 text-sm font-heading font-bold uppercase tracking-widest border-4 border-neo-dark shadow-[2px_2px_0_#0F172A]",
        toneMap[tone],
        className
      )}
      {...props}
    />
  );
}
