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
    <Card className="bg-transparent  border-none p-0 mt-8">
      <h3 className="mb-4 text-2xl font-bold text-neo-dark pl-2">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-neo-pink pl-2">Nenhum registro encontrado para este periodo.</p>
      ) : null}
      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-1 rounded-none bg-neo-bg p-4 shadow-[4px_4px_0_#0F172A] border border-white/80 transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-bold text-neo-dark ">{item.title}</p>
                <p className="text-xs font-semibold text-neo-pink tracking-wide mt-0.5">{item.dueLabel}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neo-dark/55">
                  {item.recurrenceLabel}
                  {item.installmentLabel ? ` - ${item.installmentLabel}` : ""}
                </p>
              </div>
              <Badge
                className={`text-[10px] uppercase font-bold tracking-wider border-none px-2.5 py-1 ${
                  item.status === "paid"
                    ? "bg-green-500/10 text-green-700"
                    : item.status === "warning"
                      ? "bg-amber-500/10 text-amber-700"
                      : "bg-neo-bg/10 text-neo-dark/70"
                }`}
              >
                {statusLabelMap[item.status]}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between border-t border-black/5 mt-3 pt-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neo-pink">Valor total</p>
                <p className="text-xl font-bold text-neo-dark tracking-tight">{formatCurrency(item.amount)}</p>
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
