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
    <NeoCard className="flex h-full flex-col gap-8 bg-neo-yellow p-8">
      <div className="text-center">
        <h3 className="mb-2 font-heading text-3xl uppercase text-neo-dark">{title}</h3>
        <p className="font-body text-sm font-bold uppercase tracking-[0.22em] text-neo-dark/70">
          {segments.length ? `${segments.length} categorias em destaque` : "Sem dados neste mes"}
        </p>
      </div>

      <div
        className="mx-auto flex h-52 w-52 items-center justify-center rounded-full border-4 border-neo-dark shadow-neo transition-transform hover:scale-[1.02]"
        style={{ background: chartFill }}
      >
        <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-neo-dark bg-neo-yellow text-center">
          <span className="font-heading text-4xl uppercase text-neo-dark">
            {segments.length ? Math.round((segments[0].valueCents / totalCents) * 100) : 0}%
          </span>
          <span className="px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-neo-dark/70">
            lider
          </span>
        </div>
      </div>

      <div className="rounded-none border-3 border-neo-dark bg-white p-4 shadow-[4px_4px_0_#0F172A]">
        <p className="text-center text-sm font-bold uppercase tracking-[0.18em] text-neo-dark/65">
          {totalLabel}
        </p>
        <div className="mt-4 grid gap-3">
          {segments.length === 0 ? (
            <p className="text-center text-sm font-bold text-neo-dark/60">
              Registre movimentacoes para enxergar a distribuicao.
            </p>
          ) : (
            segments.map((segment) => (
              <div key={segment.label} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 shrink-0 border-2 border-neo-dark"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="font-heading text-xl uppercase text-neo-dark">{segment.label}</span>
                </div>
                <span className="text-sm font-black text-neo-dark">
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
