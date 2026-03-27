import type { HouseSnapshot } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

interface HouseOverviewProps {
  snapshot: HouseSnapshot;
}

export function HouseOverview({ snapshot }: HouseOverviewProps) {
  return (
    <section className="grid animate-fade-in-up gap-3 pb-2 sm:gap-4">
      <Card className="neo-subsurface relative flex flex-col justify-between rounded-none border-4 border-neo-dark p-4 text-neo-dark sm:p-5 md:p-6">
        <div className="relative z-10 space-y-4 sm:space-y-6">
          <div className="flex items-start justify-between">
            <p className="text-base font-medium tracking-wide text-neo-dark sm:text-lg md:text-xl">Caixa da Casa</p>
            <div className="rounded-full bg-neo-cream/85 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-neo-dark/90 backdrop-blur-md sm:px-3 sm:text-[10px] sm:tracking-wider">
              Casa
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              {formatCurrency(snapshot.freeBalance)}
            </p>
            <p className="max-w-xs text-xs text-neo-dark/80 sm:text-sm">Saldo livre.</p>
          </div>

          <div className="grid gap-4 border-t border-neo-dark/15 pt-4 sm:grid-cols-2 sm:gap-6 sm:pt-6">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-neo-dark/80 sm:text-[10px] sm:tracking-[0.2em]">
                Total declarado
              </p>
              <p className="mt-1.5 text-xl font-semibold sm:mt-2 sm:text-2xl">{formatCurrency(snapshot.totalDeclared)}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-neo-dark/80 sm:text-[10px] sm:tracking-[0.2em]">
                Comprometido
              </p>
              <p className="mt-1.5 text-xl font-semibold text-neo-dark sm:mt-2 sm:text-2xl">
                {formatCurrency(snapshot.totalCommitted)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="neo-subsurface rounded-none border-4 border-neo-dark p-4 text-neo-dark transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_#0F172A] active:scale-95 sm:p-5">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight text-neo-dark sm:text-xl">Saude Financeira</h3>
            <Badge className="border-4 border-neo-dark bg-neo-cream px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neo-dark hover:translate-x-1 hover:translate-y-1 hover:bg-neo-cream">
              {snapshot.healthStatus}
            </Badge>
          </div>

          <p className="max-w-sm text-xs font-medium text-neo-dark/70 sm:text-sm">
            {snapshot.healthDescription} Proxima revisao em {snapshot.reviewDate}.
          </p>

          <div className="neo-subsurface grid gap-3 rounded-none border-4 border-neo-dark p-3 sm:grid-cols-3 sm:gap-4 sm:p-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-neo-pink sm:text-[10px] sm:tracking-[0.15em]">
                Saldo inicial
              </p>
              <p className="mt-1 text-base font-bold text-neo-dark sm:text-lg">
                {formatCurrency(snapshot.cycle.startingBalance)}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-neo-pink sm:text-[10px] sm:tracking-[0.15em]">
                Variacao do mes
              </p>
              <p className="mt-1 text-base font-bold text-neo-dark sm:text-lg">
                {formatCurrency(snapshot.cycle.netChange)}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-neo-pink sm:text-[10px] sm:tracking-[0.15em]">
                Saldo final
              </p>
              <p className="mt-1 text-base font-bold text-neo-dark sm:text-lg">
                {formatCurrency(snapshot.cycle.endingBalance)}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
