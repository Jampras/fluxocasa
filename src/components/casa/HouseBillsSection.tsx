import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MarkHouseBillPaidButton } from "@/components/forms/MarkHouseBillPaidButton";
import { formatCurrency } from "@/lib/utils";
import type { HouseBill } from "@/types";

interface HouseBillsSectionProps {
  title: string;
  items: HouseBill[];
  elevated?: boolean;
  allowMarkAsPaid?: boolean;
}

const statusLabelMap: Record<HouseBill["status"], string> = {
  pending: "Pendente",
  paid: "Paga",
  warning: "Urgente"
};

export function HouseBillsSection({
  title,
  items,
  elevated = false,
  allowMarkAsPaid = false
}: HouseBillsSectionProps) {
  return (
    <Card className="neo-subsurface mt-6 p-4 sm:mt-8 sm:p-5">
      <h3 className="mb-3 text-xl font-bold text-neo-dark sm:mb-4 sm:text-2xl">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-neo-pink">Nenhum registro encontrado para este periodo.</p>
      ) : null}
      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="neo-subsurface flex flex-col gap-2 rounded-none border border-neo-dark/15 p-3 shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-0.5 sm:p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-neo-dark sm:text-lg">{item.title}</p>
                <p className="mt-0.5 text-[11px] font-semibold tracking-wide text-neo-pink sm:text-xs">{item.dueLabel}</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-neo-dark/55 sm:text-[10px] sm:tracking-[0.18em]">
                  {item.recurrenceLabel}
                  {item.installmentLabel ? ` - ${item.installmentLabel}` : ""}
                </p>
              </div>
              <Badge
                className={`w-fit border-none px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  item.status === "paid"
                    ? "bg-green-500/10 text-green-700"
                    : item.status === "warning"
                      ? "bg-amber-500/10 text-amber-700"
                      : "bg-neo-cream text-neo-dark/70"
                }`}
              >
                {statusLabelMap[item.status]}
              </Badge>
            </div>
            
            <div className="mt-2 flex items-end justify-between gap-3 border-t border-black/5 pt-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-neo-pink sm:text-[10px] sm:tracking-[0.1em]">Valor total</p>
                <p className="text-lg font-bold tracking-tight text-neo-dark sm:text-xl">{formatCurrency(item.amount)}</p>
              </div>
              <div className="flex flex-col items-end justify-between h-full">
                {allowMarkAsPaid && item.status !== "paid" ? (
                  <MarkHouseBillPaidButton billId={item.id} />
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
