import { EscopoTransacao } from "@prisma/client";

import { AppHeader } from "@/components/layout/AppHeader";
import { BudgetGoals } from "@/components/pessoal/BudgetGoals";
import { ScopeTabs } from "@/components/ui/ScopeTabs";
import { Card } from "@/components/ui/Card";
import { DonutChartPreview } from "@/components/ui/DonutChartPreview";
import { WaterfallChartPreview } from "@/components/ui/WaterfallChartPreview";
import { formatCurrency } from "@/lib/utils";
import { getDashboardVisualization } from "@/server/actions/transactions";
import { requireCurrentResident } from "@/server/auth/user";
import { getHouseSnapshot } from "@/server/services/house.service";
import { getPersonalSnapshot } from "@/server/services/personal.service";

type GoalsScope = "geral" | "casa" | "pessoal";

function resolveScope(scope?: string): GoalsScope {
  if (scope === "casa" || scope === "pessoal") {
    return scope;
  }

  return "geral";
}

export default async function MetasPage({
  searchParams
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const user = await requireCurrentResident();
  const resolvedParams = await searchParams;
  const activeScope = resolveScope(resolvedParams.scope);

  const [personalSnapshot, houseSnapshot, personalVisualization, houseVisualization] =
    await Promise.all([
      getPersonalSnapshot(user.id),
      getHouseSnapshot(user.id),
      getDashboardVisualization(EscopoTransacao.PESSOAL),
      getDashboardVisualization(EscopoTransacao.CASA)
    ]);

  const goalsWithinLimit = personalSnapshot.goals.filter((goal) => goal.spent <= goal.limit).length;
  const goalsExceeded = personalSnapshot.goals.filter((goal) => goal.spent > goal.limit).length;
  const urgentPersonalBills = personalSnapshot.weeklyBills.filter((bill) => bill.status === "warning").length;
  const urgentHouseBills = houseSnapshot.pendingBills.filter((bill) => bill.status === "warning").length;

  return (
    <div className="space-y-8 pb-20">
      <AppHeader monthLabel={personalSnapshot.monthLabel} title="Metas" />

      <ScopeTabs
        currentScope={activeScope}
        tabs={[
          { id: "geral", label: "Geral", description: "Panorama consolidado" },
          { id: "pessoal", label: "Pessoal", description: "Metas e carteira" },
          { id: "casa", label: "Casa", description: "Saude compartilhada" }
        ]}
      />

      {activeScope === "geral" ? (
        <>
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="bg-white p-6">
              <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">Saldo pessoal</p>
              <h2 className="mt-3 font-heading text-5xl uppercase text-neo-dark">
                {formatCurrency(personalVisualization.safeToSpendCents / 100)}
              </h2>
            </Card>
            <Card className="bg-white p-6">
              <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">Caixa da casa</p>
              <h2 className="mt-3 font-heading text-5xl uppercase text-neo-dark">
                {formatCurrency(houseVisualization.safeToSpendCents / 100)}
              </h2>
            </Card>
            <Card className="bg-white p-6">
              <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">Metas no limite</p>
              <h2 className="mt-3 font-heading text-5xl uppercase text-neo-dark">
                {goalsWithinLimit}/{personalSnapshot.goals.length || 0}
              </h2>
            </Card>
            <Card className="bg-white p-6">
              <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">Contas urgentes</p>
              <h2 className="mt-3 font-heading text-5xl uppercase text-neo-dark">
                {urgentPersonalBills + urgentHouseBills}
              </h2>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <DonutChartPreview
              title="Distribuicao dos gastos pessoais"
              totalLabel={`Total monitorado: ${formatCurrency(
                personalVisualization.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
              )}`}
              segments={personalVisualization.donutData}
            />
            <DonutChartPreview
              title="Distribuicao das contas da casa"
              totalLabel={`Total monitorado: ${formatCurrency(
                houseVisualization.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
              )}`}
              segments={houseVisualization.donutData}
            />
            <WaterfallChartPreview
              title="Fluxo pessoal"
              subtitle="Evolucao de entradas e saidas mais recentes."
              steps={personalVisualization.waterfallData}
            />
            <WaterfallChartPreview
              title="Fluxo da casa"
              subtitle="Evolucao do caixa compartilhado em ordem cronologica."
              steps={houseVisualization.waterfallData}
            />
          </div>
        </>
      ) : null}

      {activeScope === "pessoal" ? (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-white p-6">
              <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">Saldo livre</p>
              <h2 className="mt-3 font-heading text-5xl uppercase text-neo-dark">
                {formatCurrency(personalVisualization.safeToSpendCents / 100)}
              </h2>
            </Card>
            <Card className="bg-white p-6">
              <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">Categorias estouradas</p>
              <h2 className="mt-3 font-heading text-5xl uppercase text-neo-dark">{goalsExceeded}</h2>
            </Card>
            <Card className="bg-white p-6">
              <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">Contas urgentes</p>
              <h2 className="mt-3 font-heading text-5xl uppercase text-neo-dark">{urgentPersonalBills}</h2>
            </Card>
          </div>

          <BudgetGoals bills={personalSnapshot.weeklyBills} goals={personalSnapshot.goals} />

          <div className="grid gap-6 xl:grid-cols-2">
            <DonutChartPreview
              title="Distribuicao dos gastos pessoais"
              totalLabel={`Total monitorado: ${formatCurrency(
                personalVisualization.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
              )}`}
              segments={personalVisualization.donutData}
            />
            <WaterfallChartPreview
              title="Fluxo pessoal"
              subtitle="Evolucao de entradas, contas e gastos."
              steps={personalVisualization.waterfallData}
            />
          </div>
        </>
      ) : null}

      {activeScope === "casa" ? (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-white p-6">
              <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">Saude financeira</p>
              <h2 className="mt-3 font-heading text-5xl uppercase text-neo-dark">
                {houseSnapshot.healthStatus}
              </h2>
              <p className="mt-2 font-body text-sm font-bold uppercase tracking-wide text-neo-dark/65">
                {houseSnapshot.healthDescription}
              </p>
            </Card>
            <Card className="bg-white p-6">
              <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">Caixa livre</p>
              <h2 className="mt-3 font-heading text-5xl uppercase text-neo-dark">
                {formatCurrency(houseVisualization.safeToSpendCents / 100)}
              </h2>
            </Card>
            <Card className="bg-white p-6">
              <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">Contas urgentes</p>
              <h2 className="mt-3 font-heading text-5xl uppercase text-neo-dark">{urgentHouseBills}</h2>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <DonutChartPreview
              title="Distribuicao das contas da casa"
              totalLabel={`Total monitorado: ${formatCurrency(
                houseVisualization.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
              )}`}
              segments={houseVisualization.donutData}
            />
            <WaterfallChartPreview
              title="Fluxo da casa"
              subtitle="Contribuicoes e contas compartilhadas em ordem cronologica."
              steps={houseVisualization.waterfallData}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
