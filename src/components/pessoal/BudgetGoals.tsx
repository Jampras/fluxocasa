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
    <section className="grid gap-6">
      <Card className="bg-neo-bg border-4 border-neo-dark ">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-3xl font-semibold text-neo-dark">Contas mais urgentes</h3>
            <p className="text-sm text-neo-dark/60">Pendencias pessoais com vencimento mais proximo.</p>
          </div>
          <Badge tone="danger">Urgente</Badge>
        </div>
        {bills.length === 0 ? <p className="text-sm text-neo-dark/60">Nenhuma conta pessoal pendente.</p> : null}
        {bills.map((bill) => (
          <div
            key={bill.id}
            className="flex items-center justify-between rounded-[1.75rem] bg-neo-bg px-5 py-4"
          >
            <div>
              <p className="text-2xl font-semibold text-neo-dark">{bill.title}</p>
              <p className="text-sm font-medium text-rose-600">{bill.dueLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold text-neo-dark">{formatCurrency(bill.amount)}</p>
              <div className="mt-2 flex items-center justify-end gap-3">
                <Badge tone={bill.status === "warning" ? "amber" : "danger"}>
                  {bill.status === "warning" ? "Atrasada" : "Pendente"}
                </Badge>
                <MarkPersonalBillPaidButton billId={bill.id} className="mt-0 text-neo-pink" />
              </div>
            </div>
          </div>
        ))}
      </Card>

      <Card className="bg-gradient-to-br from-[#f2b6eb] to-[#f7cde8]">
        <h3 className="mb-8 text-3xl font-semibold text-neo-dark">Metas de gasto</h3>
        {goals.length === 0 ? <p className="text-sm text-neo-dark/70">Cadastre uma meta para acompanhar categorias.</p> : null}
        <div className="space-y-8">
          {goals.map((goal) => {
            const Icon = iconMap[goal.icon as keyof typeof iconMap] ?? Target;

            return (
              <div key={goal.id} className="space-y-3">
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-none bg-neo-bg text-neo-dark">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-2xl font-semibold text-neo-dark">{goal.label}</p>
                        <p className="text-sm text-neo-dark/65">
                          {Math.round(progressValue(goal.spent, goal.limit))}% do limite mensal usado
                        </p>
                      </div>
                      <p className="text-xl font-semibold text-neo-dark">
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
