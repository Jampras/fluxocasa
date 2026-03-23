import type { HouseSnapshot } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

interface HouseOverviewProps {
  snapshot: HouseSnapshot;
}

export function HouseOverview({ snapshot }: HouseOverviewProps) {
  return (
    <section className="grid gap-4 animate-fade-in-up pb-2">
      <Card className="relative flex flex-col justify-between rounded-none border-4 border-neo-dark bg-neo-bg p-6 text-neo-dark">
        <div className="relative z-10 space-y-6">
          <div className="flex items-start justify-between">
            <p className="text-lg font-medium tracking-wide text-neo-dark md:text-xl">Caixa da Casa</p>
            <div className="rounded-full bg-neo-bg/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neo-dark/90 backdrop-blur-md">
              Casa
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-5xl font-bold tracking-tight md:text-6xl">
              {formatCurrency(snapshot.freeBalance)}
            </p>
            <p className="max-w-xs text-sm text-neo-dark/80">Saldo livre.</p>
          </div>

          <div className="grid gap-6 border-t border-white/20 pt-6 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neo-dark/80">
                Total declarado
              </p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(snapshot.totalDeclared)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neo-dark/80">
                Comprometido
              </p>
              <p className="mt-2 text-2xl font-semibold text-neo-dark">
                {formatCurrency(snapshot.totalCommitted)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="rounded-none border-4 border-neo-dark bg-neo-bg p-5 text-neo-dark transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_#0F172A] active:scale-95">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight text-neo-dark">Saude Financeira</h3>
            <Badge className="border-4 border-neo-dark bg-neo-bg px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neo-dark hover:translate-x-1 hover:translate-y-1 hover:bg-neo-bg">
              {snapshot.healthStatus}
            </Badge>
          </div>

          <p className="max-w-sm text-sm font-medium text-neo-dark/70">
            {snapshot.healthDescription} Proxima revisao em {snapshot.reviewDate}.
          </p>

          <div className="grid gap-4 rounded-none border-4 border-neo-dark bg-neo-bg p-4 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neo-pink">
                Saldo inicial
              </p>
              <p className="mt-1 text-lg font-bold text-neo-dark">
                {formatCurrency(snapshot.cycle.startingBalance)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neo-pink">
                Variacao do mes
              </p>
              <p className="mt-1 text-lg font-bold text-neo-dark">
                {formatCurrency(snapshot.cycle.netChange)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neo-pink">
                Saldo final
              </p>
              <p className="mt-1 text-lg font-bold text-neo-dark">
                {formatCurrency(snapshot.cycle.endingBalance)}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
