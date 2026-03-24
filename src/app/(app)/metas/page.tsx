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

function SummaryCard({
  label,
  value,
  description,
  accentClass = "bg-white"
}: {
  label: string;
  value: string;
  description?: string;
  accentClass?: string;
}) {
  return (
    <Card className="overflow-hidden bg-white p-0 xl:min-h-[214px]">
      <div className={`border-b-[3px] border-neo-dark px-3 py-2 sm:border-b-4 sm:px-4 sm:py-3 ${accentClass}`}>
        <p className="font-heading text-[10px] uppercase tracking-[0.16em] text-neo-dark sm:text-sm sm:tracking-[0.24em]">
          {label}
        </p>
      </div>
      <div className="space-y-2 p-3 sm:p-4 md:p-5 xl:p-6">
        <h2 className="font-heading text-3xl uppercase leading-none text-neo-dark sm:text-4xl md:text-5xl xl:text-[3.1rem]">
          {value}
        </h2>
        {description ? (
          <p className="font-body text-[11px] font-bold uppercase tracking-[0.08em] text-neo-dark/65 sm:text-sm sm:tracking-[0.12em]">
            {description}
          </p>
        ) : null}
      </div>
    </Card>
  );
}

export default async function MetasPage({
  searchParams
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const user = await requireCurrentResident();
  const resolvedParams = await searchParams;
  const activeScope = resolveScope(resolvedParams.scope);
  const resident = { id: user.id, casaId: user.casaId };

  const personalScopeData = activeScope !== "casa"
    ? await Promise.all([
        getPersonalSnapshot(user.id),
        getDashboardVisualization(EscopoTransacao.PESSOAL, resident)
      ])
    : null;
  const houseScopeData = activeScope !== "pessoal"
    ? await Promise.all([
        getHouseSnapshot(user.id),
        getDashboardVisualization(EscopoTransacao.CASA, resident)
      ])
    : null;

  const personalSnapshot = personalScopeData?.[0] ?? null;
  const personalVisualization = personalScopeData?.[1] ?? null;
  const houseSnapshot = houseScopeData?.[0] ?? null;
  const houseVisualization = houseScopeData?.[1] ?? null;
  const monthLabel =
    personalSnapshot?.monthLabel ??
    houseSnapshot?.monthLabel ??
    new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date());

  const goalsWithinLimit = personalSnapshot?.goals.filter((goal) => goal.spent <= goal.limit).length ?? 0;
  const goalsExceeded = personalSnapshot?.goals.filter((goal) => goal.spent > goal.limit).length ?? 0;
  const urgentPersonalBills = personalSnapshot?.weeklyBills.filter((bill) => bill.status === "warning").length ?? 0;
  const urgentHouseBills = houseSnapshot?.pendingBills.filter((bill) => bill.status === "warning").length ?? 0;

  return (
    <div className="space-y-6 pb-16 sm:space-y-8 sm:pb-20 xl:space-y-10">
      <AppHeader monthLabel={monthLabel} title="Metas" />

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
          <div className="space-y-4 xl:space-y-5">
            <div className="max-w-3xl space-y-1.5 sm:space-y-2">
              <p className="font-heading text-[10px] uppercase tracking-[0.2em] text-neo-pink sm:text-sm sm:tracking-[0.3em]">
                Panorama geral
              </p>
              <p className="font-body text-sm font-bold uppercase tracking-[0.12em] text-neo-dark/75 sm:text-base sm:tracking-wide">
                Metas pessoais, saude da casa e distribuicao dos fluxos no mesmo quadro.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <SummaryCard
                label="Saldo pessoal"
                value={formatCurrency(personalVisualization!.safeToSpendCents / 100)}
                accentClass="bg-neo-yellow"
              />
              <SummaryCard
                label="Caixa da casa"
                value={formatCurrency(houseVisualization!.safeToSpendCents / 100)}
                accentClass="bg-neo-cyan"
              />
              <SummaryCard
                label="Metas no limite"
                value={`${goalsWithinLimit}/${personalSnapshot!.goals.length || 0}`}
                accentClass="bg-white"
              />
              <SummaryCard
                label="Contas urgentes"
                value={String(urgentPersonalBills + urgentHouseBills)}
                accentClass="bg-neo-lime"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 xl:grid-cols-2 2xl:grid-cols-[1fr_1fr]">
            <DonutChartPreview
              title="Distribuicao dos gastos pessoais"
              totalLabel={`Total monitorado: ${formatCurrency(
                personalVisualization!.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
              )}`}
              segments={personalVisualization!.donutData}
            />
            <DonutChartPreview
              title="Distribuicao das contas da casa"
              totalLabel={`Total monitorado: ${formatCurrency(
                houseVisualization!.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
              )}`}
              segments={houseVisualization!.donutData}
            />
            <WaterfallChartPreview
              title="Fluxo pessoal"
              subtitle="Evolucao de entradas e saidas mais recentes."
              steps={personalVisualization!.waterfallData}
            />
            <WaterfallChartPreview
              title="Fluxo da casa"
              subtitle="Evolucao do caixa compartilhado em ordem cronologica."
              steps={houseVisualization!.waterfallData}
            />
          </div>
        </>
      ) : null}

      {activeScope === "pessoal" ? (
        <>
          <div className="space-y-4 xl:space-y-5">
            <div className="max-w-3xl space-y-1.5 sm:space-y-2">
              <p className="font-heading text-[10px] uppercase tracking-[0.2em] text-neo-pink sm:text-sm sm:tracking-[0.3em]">
                Metas pessoais
              </p>
              <p className="font-body text-sm font-bold uppercase tracking-[0.12em] text-neo-dark/75 sm:text-base sm:tracking-wide">
                Limites por categoria, urgencias do mes e leitura do fluxo privado.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-3">
              <SummaryCard
                label="Saldo livre"
                value={formatCurrency(personalVisualization!.safeToSpendCents / 100)}
                accentClass="bg-neo-yellow"
              />
              <SummaryCard
                label="Categorias estouradas"
                value={String(goalsExceeded)}
                accentClass="bg-neo-pink"
              />
              <SummaryCard
                label="Contas urgentes"
                value={String(urgentPersonalBills)}
                accentClass="bg-neo-lime"
              />
            </div>
          </div>

          <BudgetGoals bills={personalSnapshot!.weeklyBills} goals={personalSnapshot!.goals} />

          <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
            <DonutChartPreview
              title="Distribuicao dos gastos pessoais"
              totalLabel={`Total monitorado: ${formatCurrency(
                personalVisualization!.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
              )}`}
              segments={personalVisualization!.donutData}
            />
            <WaterfallChartPreview
              title="Fluxo pessoal"
              subtitle="Evolucao de entradas, contas e gastos."
              steps={personalVisualization!.waterfallData}
            />
          </div>
        </>
      ) : null}

      {activeScope === "casa" ? (
        <>
          <div className="space-y-4 xl:space-y-5">
            <div className="max-w-3xl space-y-1.5 sm:space-y-2">
              <p className="font-heading text-[10px] uppercase tracking-[0.2em] text-neo-pink sm:text-sm sm:tracking-[0.3em]">
                Saude da casa
              </p>
              <p className="font-body text-sm font-bold uppercase tracking-[0.12em] text-neo-dark/75 sm:text-base sm:tracking-wide">
                Caixa livre, urgencias e distribuicao das contas compartilhadas.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-3">
              <SummaryCard
                label="Saude financeira"
                value={houseSnapshot!.healthStatus}
                description={houseSnapshot!.healthDescription}
                accentClass="bg-white"
              />
              <SummaryCard
                label="Caixa livre"
                value={formatCurrency(houseVisualization!.safeToSpendCents / 100)}
                accentClass="bg-neo-cyan"
              />
              <SummaryCard
                label="Contas urgentes"
                value={String(urgentHouseBills)}
                accentClass="bg-neo-lime"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
            <DonutChartPreview
              title="Distribuicao das contas da casa"
              totalLabel={`Total monitorado: ${formatCurrency(
                houseVisualization!.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
              )}`}
              segments={houseVisualization!.donutData}
            />
            <WaterfallChartPreview
              title="Fluxo da casa"
              subtitle="Contribuicoes e contas compartilhadas em ordem cronologica."
              steps={houseVisualization!.waterfallData}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
