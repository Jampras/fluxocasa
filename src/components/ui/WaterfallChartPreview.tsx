import { formatCurrency } from "@/lib/utils";

import { NeoCard } from "./NeoCard";

interface WaterfallChartPreviewProps {
  title: string;
  subtitle: string;
  steps: Array<{
    id: string;
    label: string;
    amountCents: number;
    dateLabel: string;
    runningTotalCents: number;
  }>;
}

export function WaterfallChartPreview({
  title,
  subtitle,
  steps
}: WaterfallChartPreviewProps) {
  const visibleSteps = steps.slice(-6);
  const maxMagnitude = Math.max(...visibleSteps.map((item) => Math.abs(item.amountCents)), 1);
  const finalBalance = visibleSteps[visibleSteps.length - 1]?.runningTotalCents ?? 0;

  return (
    <NeoCard className="relative flex h-full flex-col gap-8 bg-white p-6 lg:p-10">
      <div className="flex flex-col gap-2">
        <h3 className="font-heading text-3xl uppercase text-neo-dark">{title}</h3>
        <p className="font-body text-sm font-bold uppercase tracking-[0.18em] text-neo-dark/65">
          {subtitle}
        </p>
      </div>

      <div className="rounded-none border-3 border-neo-dark bg-neo-bg p-4 shadow-[4px_4px_0_#0F172A]">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-neo-pink">Saldo projetado</p>
        <p className="mt-2 font-heading text-4xl uppercase text-neo-dark">
          {formatCurrency(finalBalance / 100)}
        </p>
      </div>

      <div className="relative h-[320px] border-b-4 border-neo-dark">
        <div className="absolute left-0 right-0 top-1/2 border-b-4 border-dashed border-neo-dark/20" />

        {visibleSteps.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <p className="max-w-sm text-sm font-bold text-neo-dark/60">
              Ainda nao ha movimentacoes suficientes para desenhar o fluxo deste mes.
            </p>
          </div>
        ) : (
          <div className="grid h-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {visibleSteps.map((step) => {
              const height = `${Math.max((Math.abs(step.amountCents) / maxMagnitude) * 44, 16)}%`;
              const positive = step.amountCents >= 0;

              return (
                <div key={step.id} className="relative flex h-full items-center justify-center">
                  <div
                    className={`absolute w-full max-w-[88px] border-4 border-neo-dark shadow-[4px_4px_0_#0F172A] ${
                      positive ? "bottom-1/2 bg-neo-lime text-neo-dark" : "top-1/2 bg-neo-pink text-white"
                    }`}
                    style={{ height }}
                  />
                  <div className="absolute bottom-3 left-0 right-0 text-center">
                    <p className="truncate px-1 font-heading text-lg uppercase text-neo-dark">{step.label}</p>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neo-dark/65">
                      {step.dateLabel}
                    </p>
                    <p className="mt-1 text-sm font-black text-neo-dark">
                      {positive ? "+" : "-"}
                      {formatCurrency(Math.abs(step.amountCents) / 100)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </NeoCard>
  );
}
