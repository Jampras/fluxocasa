import { NeoCard } from "@/components/ui/NeoCard";

export function ChartCardSkeleton({
  title,
  subtitle,
  accentClass = "bg-neo-cream"
}: {
  title: string;
  subtitle: string;
  accentClass?: string;
}) {
  return (
    <NeoCard className={`flex h-full flex-col gap-5 p-4 sm:gap-6 sm:p-5 lg:gap-8 lg:p-8 ${accentClass}`}>
      <div className="space-y-2">
        <div className="h-7 w-3/4 animate-pulse bg-neo-dark/10 sm:h-8" />
        <div className="h-3 w-full animate-pulse bg-neo-dark/10 sm:h-4" />
        <div className="h-3 w-2/3 animate-pulse bg-neo-dark/10 sm:h-4" />
      </div>

      <div className="grid flex-1 place-items-center">
        <div className="grid gap-4 place-items-center">
          <div className="h-40 w-40 animate-pulse rounded-full border-4 border-neo-dark/20 bg-neo-dark/5 sm:h-44 sm:w-44 md:h-52 md:w-52" />
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-neo-dark/50 sm:text-sm">
            {title}
          </p>
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-neo-dark/35 sm:text-xs">
            {subtitle}
          </p>
        </div>
      </div>
    </NeoCard>
  );
}
