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
    <NeoCard className="relative flex h-full flex-col gap-5 bg-neo-cream p-4 sm:gap-6 sm:p-5 lg:gap-8 lg:p-8">
      <div className="flex flex-col gap-2">
        <h3 className="font-heading text-2xl uppercase text-neo-dark sm:text-3xl">{title}</h3>
        <p className="font-body text-[10px] font-bold uppercase tracking-[0.12em] text-neo-dark/65 sm:text-sm sm:tracking-[0.18em]">
          {subtitle}
        </p>
      </div>

      <div className="rounded-none border-[3px] border-neo-dark bg-neo-bg p-3 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neo-pink sm:text-xs sm:tracking-[0.22em]">Saldo projetado</p>
        <p className="mt-1.5 font-heading text-3xl uppercase text-neo-dark sm:mt-2 sm:text-4xl">
          {formatCurrency(finalBalance / 100)}
        </p>
      </div>

      <div className="relative h-[260px] border-b-[3px] border-neo-dark sm:h-[300px] sm:border-b-4 lg:h-[320px]">
        <div className="absolute left-0 right-0 top-1/2 border-b-4 border-dashed border-neo-dark/20" />

        {visibleSteps.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <p className="max-w-sm text-sm font-bold text-neo-dark/60">
              Ainda nao ha movimentacoes suficientes para desenhar o fluxo deste mes.
            </p>
          </div>
        ) : (
          <div className="grid h-full grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
            {visibleSteps.map((step) => {
              const height = `${Math.max((Math.abs(step.amountCents) / maxMagnitude) * 44, 16)}%`;
              const positive = step.amountCents >= 0;

              return (
                <div key={step.id} className="relative flex h-full items-center justify-center">
                  <div
                    className={`absolute w-full max-w-[72px] border-[3px] border-neo-dark shadow-[3px_3px_0_#0F172A] sm:max-w-[80px] sm:border-4 sm:shadow-[4px_4px_0_#0F172A] md:max-w-[88px] ${
                      positive ? "bottom-1/2 bg-neo-lime text-neo-dark" : "top-1/2 bg-neo-pink text-white"
                    }`}
                    style={{ height }}
                  />
                  <div className="absolute bottom-3 left-0 right-0 text-center">
                    <p className="truncate px-1 font-heading text-sm uppercase text-neo-dark sm:text-base md:text-lg">{step.label}</p>
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-neo-dark/65 sm:text-[10px] md:text-[11px] md:tracking-[0.16em]">
                      {step.dateLabel}
                    </p>
                    <p className="mt-1 text-xs font-black text-neo-dark sm:text-sm">
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
