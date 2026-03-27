import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import type { ExpenseRecord, IncomeRecord } from "@/types";

type PersonalHistoryItem = {
  id: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  amount: number;
  tone: "income" | "expense";
  sortKey: string;
};

function buildHistoryItems(incomes: IncomeRecord[], expenses: ExpenseRecord[]) {
  const incomeItems: PersonalHistoryItem[] = incomes
    .filter((item) => item.status === "received")
    .map((item) => ({
      id: `income-${item.id}`,
      title: item.title,
      subtitle: `Recebimento - ${item.categoryLabel}`,
      dateLabel: item.dateLabel,
      amount: item.amount,
      tone: "income",
      sortKey: item.receivedDate ?? item.referenceDate
    }));

  const expenseItems: PersonalHistoryItem[] = expenses.map((item) => ({
    id: `expense-${item.id}`,
    title: item.title,
    subtitle: `Saida - ${item.category}`,
    dateLabel: `Lancado em ${new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short"
    }).format(new Date(`${item.expenseDate}T12:00:00`))}`,
    amount: item.amount,
    tone: "expense",
    sortKey: item.expenseDate
  }));

  return [...incomeItems, ...expenseItems].sort((a, b) => b.sortKey.localeCompare(a.sortKey)).slice(0, 8);
}

export function PersonalHistorySection({
  incomes,
  expenses
}: {
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
}) {
  const items = buildHistoryItems(incomes, expenses);

  return (
    <Card className="bg-neo-cream p-4 sm:p-5 md:p-6">
      <div className="space-y-1">
        <p className="font-heading text-[10px] uppercase tracking-[0.18em] text-neo-pink sm:text-sm sm:tracking-[0.26em]">
          Historico pessoal
        </p>
        <h3 className="font-heading text-2xl uppercase text-neo-dark sm:text-3xl">Ultimos registros concluidos</h3>
        <p className="text-sm font-bold uppercase tracking-[0.08em] text-neo-dark/65">
          Entradas recebidas e saidas ja realizadas no seu fluxo privado.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:mt-5">
        {items.length === 0 ? (
          <div className="neo-subsurface border-[3px] border-neo-dark px-4 py-5 text-sm font-bold text-neo-dark/65 sm:border-4">
            Nenhum movimento concluido no historico pessoal ainda.
          </div>
        ) : null}

        {items.map((item) => (
          <div
            key={item.id}
              className="neo-subsurface flex flex-col gap-3 border-[3px] border-neo-dark px-4 py-4 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`border-[3px] border-neo-dark px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] sm:border-4 ${
                    item.tone === "income" ? "bg-neo-lime text-neo-dark" : "bg-neo-pink text-neo-dark"
                  }`}
                >
                  {item.tone === "income" ? "Recebido" : "Saida"}
                </span>
              </div>
              <p className="font-heading text-2xl uppercase text-neo-dark sm:text-3xl">{item.title}</p>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-neo-dark/65 sm:text-sm">
                {item.subtitle}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-neo-pink sm:text-xs">
                {item.dateLabel}
              </p>
            </div>

            <p className="font-heading text-3xl uppercase text-neo-dark sm:text-4xl">
              {item.tone === "income" ? "+" : "-"}
              {formatCurrency(item.amount)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
