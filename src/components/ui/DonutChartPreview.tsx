import { formatCurrency } from "@/lib/utils";

import { NeoCard } from "./NeoCard";

interface DonutChartPreviewProps {
  title: string;
  totalLabel: string;
  segments: Array<{
    label: string;
    valueCents: number;
    color: string;
  }>;
}

export function DonutChartPreview({ title, totalLabel, segments }: DonutChartPreviewProps) {
  const totalCents = segments.reduce((sum, item) => sum + item.valueCents, 0);
  let cursor = 0;

  const chartFill = segments.length
    ? `conic-gradient(${segments
        .map((segment) => {
          const start = totalCents ? (cursor / totalCents) * 100 : 0;
          cursor += segment.valueCents;
          const end = totalCents ? (cursor / totalCents) * 100 : 0;
          return `${segment.color} ${start}% ${end}%`;
        })
        .join(", ")})`
    : "conic-gradient(#FFFFFF 0% 100%)";

  return (
    <NeoCard className="flex h-full flex-col gap-5 bg-neo-yellow p-4 sm:gap-6 sm:p-5 md:gap-8 md:p-8">
      <div className="text-center">
        <h3 className="mb-1.5 font-heading text-2xl uppercase text-neo-dark sm:mb-2 sm:text-3xl">{title}</h3>
        <p className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-neo-dark/70 sm:text-sm sm:tracking-[0.22em]">
          {segments.length ? `${segments.length} categorias em destaque` : "Sem dados neste mes"}
        </p>
      </div>

      <div
        className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border-[3px] border-neo-dark shadow-[4px_4px_0_#0F172A] transition-transform hover:scale-[1.02] sm:h-44 sm:w-44 sm:border-4 sm:shadow-[5px_5px_0_#0F172A] md:h-52 md:w-52 md:shadow-neo"
        style={{ background: chartFill }}
      >
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-[3px] border-neo-dark bg-neo-yellow text-center sm:h-28 sm:w-28 sm:border-4">
          <span className="font-heading text-3xl uppercase text-neo-dark sm:text-4xl">
            {segments.length ? Math.round((segments[0].valueCents / totalCents) * 100) : 0}%
          </span>
          <span className="px-2 text-[9px] font-bold uppercase tracking-[0.12em] text-neo-dark/70 sm:text-[11px] sm:tracking-[0.18em]">
            lider
          </span>
        </div>
      </div>

      <div className="rounded-none border-[3px] border-neo-dark bg-neo-cream p-3 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:p-4">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.12em] text-neo-dark/65 sm:text-sm sm:tracking-[0.18em]">
          {totalLabel}
        </p>
        <div className="mt-3 grid gap-2.5 sm:mt-4 sm:gap-3">
          {segments.length === 0 ? (
            <p className="text-center text-sm font-bold text-neo-dark/60">
              Registre movimentacoes para enxergar a distribuicao.
            </p>
          ) : (
            segments.map((segment) => (
              <div key={segment.label} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="h-3.5 w-3.5 shrink-0 border-2 border-neo-dark sm:h-4 sm:w-4" style={{ backgroundColor: segment.color }} />
                  <span className="font-heading text-lg uppercase text-neo-dark sm:text-xl">{segment.label}</span>
                </div>
                <span className="text-xs font-black text-neo-dark sm:text-sm">
                  {formatCurrency(segment.valueCents / 100)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </NeoCard>
  );
}
