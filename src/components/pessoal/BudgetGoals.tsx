import { Car, Target, Utensils } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MarkPersonalBillPaidButton } from "@/components/forms/MarkPersonalBillPaidButton";
import { formatCurrency, progressValue } from "@/lib/utils";
import type { BudgetGoal, HouseBill } from "@/types";

const iconMap = {
  Utensils,
  Car,
  Target
};

interface BudgetGoalsProps {
  bills: HouseBill[];
  goals: BudgetGoal[];
}

export function BudgetGoals({ bills, goals }: BudgetGoalsProps) {
  return (
    <section className="grid gap-4 sm:gap-6">
      <Card className="border-4 border-neo-dark bg-neo-bg p-4 sm:p-5 md:p-6">
        <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6 sm:gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-neo-dark sm:text-3xl">Contas mais urgentes</h3>
            <p className="text-xs text-neo-dark/60 sm:text-sm">Pendencias pessoais com vencimento mais proximo.</p>
          </div>
          <Badge tone="danger">Urgente</Badge>
        </div>
        {bills.length === 0 ? <p className="text-sm text-neo-dark/60">Nenhuma conta pessoal pendente.</p> : null}
        <div className="grid gap-3">
          {bills.map((bill) => (
            <div
              key={bill.id}
              className="grid gap-3 border-[3px] border-neo-dark bg-white px-3 py-3 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:px-4 sm:py-4 lg:grid-cols-[1fr_auto]"
            >
              <div>
                <p className="text-xl font-semibold text-neo-dark sm:text-2xl">{bill.title}</p>
                <p className="text-xs font-medium text-rose-600 sm:text-sm">{bill.dueLabel}</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-neo-dark/55 sm:text-[10px] sm:tracking-[0.18em]">
                  {bill.recurrenceLabel}
                  {bill.installmentLabel ? ` - ${bill.installmentLabel}` : ""}
                </p>
              </div>
              <div className="flex flex-col gap-2 lg:items-end lg:text-right">
                <p className="text-2xl font-semibold text-neo-dark sm:text-3xl">{formatCurrency(bill.amount)}</p>
                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  <Badge tone={bill.status === "warning" ? "amber" : "danger"}>
                    {bill.status === "warning" ? "Urgente" : "Pendente"}
                  </Badge>
                  <MarkPersonalBillPaidButton billId={bill.id} className="mt-0 text-neo-pink" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-4 border-neo-dark bg-neo-yellow p-4 sm:p-5 md:p-6">
        <h3 className="mb-5 text-2xl font-semibold text-neo-dark sm:mb-8 sm:text-3xl">Metas de gasto</h3>
        {goals.length === 0 ? <p className="text-sm text-neo-dark/70">Cadastre uma meta para acompanhar categorias.</p> : null}
        <div className="space-y-5 sm:space-y-8">
          {goals.map((goal) => {
            const Icon = iconMap[goal.icon as keyof typeof iconMap] ?? Target;

            return (
              <div key={goal.id} className="space-y-3 rounded-none border-[3px] border-neo-dark bg-white p-3 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:p-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-none border-[3px] border-neo-dark bg-neo-bg text-neo-dark sm:h-11 sm:w-11 sm:border-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                      <div>
                        <p className="text-xl font-semibold text-neo-dark sm:text-2xl">{goal.label}</p>
                        <p className="text-xs text-neo-dark/65 sm:text-sm">
                          {Math.round(progressValue(goal.spent, goal.limit))}% do limite mensal usado
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-neo-dark sm:text-xl">
                        {formatCurrency(goal.spent)} / {formatCurrency(goal.limit)}
                      </p>
                    </div>
                  </div>
                </div>
                <ProgressBar spent={goal.spent} limit={goal.limit} tone={goal.tone} />
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
