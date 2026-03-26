import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import type { PersonalSnapshot } from "@/types";

interface PersonalOverviewProps {
  snapshot: PersonalSnapshot;
}

export function PersonalOverview({ snapshot }: PersonalOverviewProps) {
  return (
    <section className="grid animate-fade-in-up gap-3 pb-2 sm:gap-4">
      <Card className="neo-subsurface relative rounded-none border-4 border-neo-dark p-4 text-neo-dark sm:p-5 md:p-6">
        <div className="relative z-10 flex flex-col justify-between space-y-4 sm:space-y-6">
          <p className="text-base font-medium tracking-wide text-neo-dark sm:text-lg md:text-xl">Saldo pessoal</p>
          <div className="space-y-1">
            <p className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">{formatCurrency(snapshot.totalMonthly)}</p>
            <p className="max-w-xs text-xs text-neo-dark/80 sm:text-sm">Disponivel para uso pessoal neste mes.</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="neo-subsurface rounded-none border-4 border-neo-dark p-3 text-neo-dark transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_#0F172A] active:scale-95 sm:p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-neo-pink sm:text-[10px] sm:tracking-[0.1em]">Salario recebido</p>
          <p className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{formatCurrency(snapshot.salary)}</p>
        </Card>
        <Card className="neo-subsurface rounded-none border-4 border-neo-dark p-3 text-neo-dark transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_#0F172A] active:scale-95 sm:p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-neo-pink sm:text-[10px] sm:tracking-[0.1em]">Renda extra recebida</p>
          <p className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{formatCurrency(snapshot.freelance)}</p>
        </Card>
      </div>

      <Card className="neo-subsurface rounded-none border-4 border-neo-dark p-4 text-neo-dark transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_#0F172A] active:scale-95 sm:p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-neo-dark/70 sm:text-sm sm:tracking-wide">Contribuicao da casa</p>
          <p className="text-lg font-bold tracking-tight sm:text-xl">{formatCurrency(snapshot.declaredContribution)}</p>
        </div>
      </Card>
    </section>
  );
}
