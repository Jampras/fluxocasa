import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import type { PersonalSnapshot } from "@/types";

interface PersonalOverviewProps {
  snapshot: PersonalSnapshot;
}

export function PersonalOverview({ snapshot }: PersonalOverviewProps) {
  return (
    <section className="grid gap-4 animate-fade-in-up pb-2">
      <Card className="bg-neo-bg border-4 border-neo-dark  rounded-none p-6 text-neo-dark relative">
        <div className="space-y-6 relative z-10 flex flex-col justify-between">
          <p className="text-lg md:text-xl font-medium tracking-wide text-neo-dark ">Saldo pessoal</p>
          <div className="space-y-1">
            <p className="text-5xl md:text-6xl font-bold tracking-tight ">{formatCurrency(snapshot.totalMonthly)}</p>
            <p className="max-w-xs text-sm text-neo-dark/80">Disponivel para uso pessoal neste mes.</p>
          </div>
        </div>
      </Card>
      
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-neo-bg  border-4 border-neo-dark rounded-none p-4 text-neo-dark transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_#0F172A] active:scale-95 transition-all">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neo-pink">Salário</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{formatCurrency(snapshot.salary)}</p>
        </Card>
        <Card className="bg-neo-bg  border-4 border-neo-dark rounded-none p-4 text-neo-dark transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_#0F172A] active:scale-95 transition-all">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neo-pink">Renda extra</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{formatCurrency(snapshot.freelance)}</p>
        </Card>
      </div>

      <Card className="bg-neo-bg border-4 border-neo-dark  rounded-none p-5 text-neo-dark transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_#0F172A] active:scale-95 transition-all">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-neo-dark/70 tracking-wide uppercase">Contribuicao da casa</p>
          <p className="text-xl font-bold tracking-tight">{formatCurrency(snapshot.declaredContribution)}</p>
        </div>
      </Card>
    </section>
  );
}

