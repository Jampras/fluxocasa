import { CheckCircle2 } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import type { HouseContribution } from "@/types";

interface ContributionsListProps {
  items: HouseContribution[];
}

export function ContributionsList({ items }: ContributionsListProps) {
  return (
    <Card className="bg-transparent  border-none p-0 mt-8">
      <div className="mb-4 flex items-center justify-between pl-2">
        <h3 className="text-2xl font-bold text-neo-dark">Contribuições</h3>
        <Badge className="bg-neo-bg text-neo-dark border-none font-bold text-xs">{items.length} moradores</Badge>
      </div>
      {items.length === 0 ? <p className="text-sm text-neo-pink pl-2">Nenhuma contribuição declarada ainda.</p> : null}
      <div className="grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 rounded-none bg-neo-bg p-4 shadow-[4px_4px_0_#0F172A] border border-white/80 transition-all hover:-translate-y-0.5">
            <div className="grid h-[3rem] w-[3rem] shrink-0 place-items-center rounded-full bg-neo-bg/15 font-bold text-neo-yellow text-lg mix-blend-multiply">
              {item.avatar}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-bold text-neo-dark ">{item.residentName}</p>
                  <p className="text-xs font-semibold text-neo-pink">{formatCurrency(item.amount)}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500" strokeWidth={2.5} />
              </div>
              <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-zinc-800 to-emerald-400" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
