import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import type { HouseBill } from "@/types";

export function HouseHistorySection({
  paidBills
}: {
  paidBills: HouseBill[];
}) {
  return (
    <Card className="bg-white p-4 sm:p-5 md:p-6">
      <div className="space-y-1">
        <p className="font-heading text-[10px] uppercase tracking-[0.18em] text-neo-pink sm:text-sm sm:tracking-[0.26em]">
          Historico financeiro
        </p>
        <h3 className="font-heading text-2xl uppercase text-neo-dark sm:text-3xl">Contas pagas da casa</h3>
      </div>

      <div className="mt-4 grid gap-3 sm:mt-5">
        {paidBills.length === 0 ? (
          <div className="border-[3px] border-neo-dark bg-neo-bg px-4 py-5 text-sm font-bold text-neo-dark/65 sm:border-4">
            Ainda nao existem contas pagas neste historico da casa.
          </div>
        ) : null}

        {paidBills.map((bill) => (
          <div
            key={bill.id}
            className="flex flex-col gap-3 border-[3px] border-neo-dark bg-neo-bg px-4 py-4 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="space-y-1">
              <span className="inline-flex border-[3px] border-neo-dark bg-neo-lime px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-neo-dark sm:border-4">
                Paga
              </span>
              <p className="font-heading text-2xl uppercase text-neo-dark sm:text-3xl">{bill.title}</p>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-neo-dark/65 sm:text-sm">
                {bill.dueLabel}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-neo-pink sm:text-xs">
                {bill.recurrenceLabel}
                {bill.installmentLabel ? ` - ${bill.installmentLabel}` : ""}
              </p>
            </div>

            <p className="font-heading text-3xl uppercase text-neo-dark sm:text-4xl">
              {formatCurrency(bill.amount)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
