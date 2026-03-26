import type { HTMLAttributes } from "react";

import type { Tone } from "@/types";
import { cx } from "@/lib/utils";

const toneMap: Record<Tone | "primary", string> = {
  emerald: "bg-neo-lime text-neo-dark",
  zinc: "bg-neo-cream text-neo-dark",
  amber: "bg-neo-yellow text-neo-dark",
  slate: "bg-neo-cream text-neo-dark",
  danger: "bg-neo-pink text-white",
  success: "bg-neo-lime text-neo-dark",
  primary: "bg-neo-cyan text-neo-dark"
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone | "primary";
}

export function Badge({ className, tone = "primary", ...props }: BadgeProps) {
  const animatedTone = tone === "danger" || tone === "success" || tone === "amber";

  return (
    <span
      className={cx(
        "inline-flex items-center border-[3px] border-neo-dark px-2.5 py-1 text-[10px] font-heading font-bold uppercase tracking-[0.16em] shadow-[2px_2px_0_#0F172A] sm:border-4 sm:px-3 sm:text-xs sm:tracking-[0.18em]",
        animatedTone && "neo-badge-pulse",
        toneMap[tone],
        className
      )}
      {...props}
    />
  );
}
