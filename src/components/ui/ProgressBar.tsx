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
  const value = progressValue(spent, limit);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.14em] text-neo-dark/60 sm:text-xs">
        <span>Progresso</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div
        className="relative h-4 w-full overflow-hidden rounded-none border-[3px] border-neo-dark bg-white sm:border-4"
      >
        <div
          className={cx("neo-shimmer h-full bg-gradient-to-r transition-all", fills[tone])}
          style={{ width: `${value}%` }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_0_38%,rgba(255,255,255,0.25)_38%_50%,transparent_50%_100%)] opacity-70" />
      </div>
    </div>
  );
}

