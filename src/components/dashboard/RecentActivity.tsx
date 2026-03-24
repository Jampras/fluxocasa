import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MarkHouseBillPaidButton } from "@/components/forms/MarkHouseBillPaidButton";
import { MarkIncomeReceivedButton } from "@/components/forms/MarkIncomeReceivedButton";
import { MarkPersonalBillPaidButton } from "@/components/forms/MarkPersonalBillPaidButton";
import { formatCurrency } from "@/lib/utils";
import type { ActivityItem } from "@/types";

interface RecentActivityProps {
  items: ActivityItem[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <section className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neo-dark sm:text-3xl">Historico recente</h2>
          <p className="text-xs text-neo-dark/70 sm:text-sm">Revise suas ultimas movimentacoes registradas.</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-neo-dark sm:text-sm sm:normal-case sm:tracking-normal">
          Ultimos registros
        </span>
      </div>
      <Card className="overflow-hidden border-4 border-neo-dark bg-neo-bg p-0">
        {items.length === 0 ? (
          <div className="px-4 py-4 text-sm text-neo-dark/60 sm:px-6 sm:py-5">
            As movimentacoes aparecerao aqui assim que voce registrar dados.
          </div>
        ) : null}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 border-b-2 border-neo-pink/20 px-4 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6 sm:py-5"
          >
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold text-neo-dark sm:text-2xl">{item.title}</p>
              <p className="text-xs text-neo-dark/70 sm:text-sm">{item.subtitle}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neo-pink sm:text-xs sm:tracking-[0.16em]">
                {item.dateLabel}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:min-w-[150px] sm:items-end sm:text-right">
              <p className="text-xl font-semibold text-neo-dark sm:text-2xl">{formatCurrency(item.amount)}</p>
              <Badge tone={item.badge.tone}>{item.badge.label}</Badge>
              <div className="flex flex-wrap items-center gap-3 sm:mt-1 sm:justify-end">
                {item.detailsHref ? (
                  <a
                    href={item.detailsHref}
                    className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neo-dark/70 transition-colors hover:text-neo-pink sm:text-xs sm:tracking-[0.18em]"
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
                {item.canMarkIncomeAsReceived && item.incomeId ? (
                  <MarkIncomeReceivedButton
                    incomeId={item.incomeId}
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
