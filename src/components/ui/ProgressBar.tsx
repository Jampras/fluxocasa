import { cx, progressValue } from "@/lib/utils";
import type { Tone } from "@/types";

const fills: Record<Tone, string> = {
  emerald: "from-emerald-700 to-emerald-400",
  zinc: "from-zinc-500 to-zinc-300",
  amber: "from-orange-500 to-amber-300",
  slate: "from-slate-500 to-slate-300",
  danger: "from-rose-600 to-rose-300",
  success: "from-emerald-500 to-lime-300"
};

interface ProgressBarProps {
  spent: number;
  limit: number;
  tone?: Tone;
}

export function ProgressBar({ spent, limit, tone = "emerald" }: ProgressBarProps) {
  return (
    <div className="h-3 w-full rounded-full bg-dopamine-bg/75">
      <div
        className={cx("h-full rounded-full bg-gradient-to-r transition-all", fills[tone])}
        style={{ width: `${progressValue(spent, limit)}%` }}
      />
    </div>
  );
}

