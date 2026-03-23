import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MarkHouseBillPaidButton } from "@/components/forms/MarkHouseBillPaidButton";
import { MarkPersonalBillPaidButton } from "@/components/forms/MarkPersonalBillPaidButton";
import { formatCurrency } from "@/lib/utils";
import type { ActivityItem } from "@/types";

interface RecentActivityProps {
  items: ActivityItem[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-neo-dark">Historico recente</h2>
          <p className="text-sm text-neo-dark/70">Revise suas ultimas movimentacoes registradas.</p>
        </div>
        <span className="text-sm font-semibold text-neo-dark">Ultimos registros</span>
      </div>
      <Card className="overflow-hidden bg-neo-bg border-4 border-neo-dark  p-0">
        {items.length === 0 ? (
          <div className="px-6 py-5 text-sm text-neo-dark/60">As movimentacoes aparecerao aqui assim que voce registrar dados.</div>
        ) : null}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-4 border-b-2 border-neo-pink/20 px-6 py-5 last:border-b-0"
          >
            <div>
              <p className="text-2xl font-semibold text-neo-dark">{item.title}</p>
              <p className="text-sm text-neo-dark/70">{item.subtitle}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-neo-pink">{item.dateLabel}</p>
            </div>
            <div className="min-w-[150px] text-right">
              <p className="text-2xl font-semibold text-neo-dark">{formatCurrency(item.amount)}</p>
              <Badge tone={item.badge.tone}>{item.badge.label}</Badge>
              <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
                {item.detailsHref ? (
                  <a
                    href={item.detailsHref}
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-neo-dark/70 transition-colors hover:text-neo-pink"
                  >
                    {item.detailsLabel ?? "Abrir"}
                  </a>
                ) : null}
                {item.canMarkAsPaid && item.houseBillId ? (
                  <MarkHouseBillPaidButton
                    billId={item.houseBillId}
                    className="mt-0 text-neo-pink"
                  />
                ) : null}
                {item.canMarkPersonalAsPaid && item.personalBillId ? (
                  <MarkPersonalBillPaidButton
                    billId={item.personalBillId}
                    className="mt-0 text-neo-pink"
                  />
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </Card>
    </section>
  );
}
