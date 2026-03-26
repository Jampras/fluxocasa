import { Suspense } from "react";
import { EscopoTransacao } from "@prisma/client";

import { DashboardMetricCarousel } from "@/components/dashboard/DashboardMetricCarousel";
import {
  GeneralGoalsCharts,
  GoalsChartsGridSkeleton,
  HouseGoalsCharts,
  PersonalGoalsCharts
} from "@/components/metas/GoalsChartSections";
import { AppHeader } from "@/components/layout/AppHeader";
import { BudgetGoals } from "@/components/pessoal/BudgetGoals";
import { ScopeTabs } from "@/components/ui/ScopeTabs";
import { formatCurrency } from "@/lib/utils";
import { getDashboardVisualizationSummary } from "@/server/actions/transactions";
import { requireCurrentResident } from "@/server/auth/user";
import { getHouseSnapshot } from "@/server/services/house.service";
import { getGoalsOverviewSummary } from "@/server/services/metas.service";
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
  const resident = { id: user.id, casaId: user.casaId };
  const defaultMonthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(new Date());

  const [generalOverview, personalSnapshot, personalSummary, houseSnapshot, houseSummary] = await Promise.all([
    activeScope === "geral" ? getGoalsOverviewSummary(user.id) : Promise.resolve(null),
    activeScope === "pessoal"
      ? getPersonalSnapshot(user.id)
      : Promise.resolve(null),
    activeScope !== "casa"
      ? getDashboardVisualizationSummary(EscopoTransacao.PESSOAL, resident)
      : Promise.resolve(null)
    ,
    activeScope === "casa"
      ? getHouseSnapshot(user.id)
      : Promise.resolve(null),
    activeScope !== "pessoal"
      ? getDashboardVisualizationSummary(EscopoTransacao.CASA, resident)
      : Promise.resolve(null)
  ]);
  const monthLabel =
    generalOverview?.monthLabel ??
    personalSnapshot?.monthLabel ??
    houseSnapshot?.monthLabel ??
    defaultMonthLabel;
  const totalGoals = generalOverview?.totalGoals ?? personalSnapshot?.goals.length ?? 0;

  const goalsWithinLimit =
    activeScope === "geral"
      ? (generalOverview?.goalsWithinLimit ?? 0)
      : (personalSnapshot?.goals.filter((goal) => goal.spent <= goal.limit).length ?? 0);
  const goalsExceeded = personalSnapshot?.goals.filter((goal) => goal.spent > goal.limit).length ?? 0;
  const urgentPersonalBills =
    activeScope === "geral"
      ? (generalOverview?.urgentPersonalBills ?? 0)
      : (personalSnapshot?.weeklyBills.filter((bill) => bill.status === "warning").length ?? 0);
  const urgentHouseBills =
    activeScope === "geral"
      ? (generalOverview?.urgentHouseBills ?? 0)
      : (houseSnapshot?.pendingBills.filter((bill) => bill.status === "warning").length ?? 0);

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
            <DashboardMetricCarousel
              items={[
                {
                  label: "Saldo pessoal",
                  value: formatCurrency(personalSummary!.safeToSpendCents / 100),
                  description: "Margem privada disponivel para o mes.",
                  accentClass: "bg-neo-yellow"
                },
                {
                  label: "Caixa da casa",
                  value: formatCurrency(houseSummary!.safeToSpendCents / 100),
                  description: "Saldo compartilhado projetado agora.",
                  accentClass: "bg-neo-cyan"
                },
                {
                  label: "Metas no limite",
                  value: `${goalsWithinLimit}/${totalGoals}`,
                  description: "Categorias ainda dentro do teto mensal.",
                  accentClass: "bg-white"
                },
                {
                  label: "Contas urgentes",
                  value: String(urgentPersonalBills + urgentHouseBills),
                  description: "Alertas que pedem acao nesta semana.",
                  accentClass: "bg-neo-lime"
                }
              ]}
            />
          </div>

          <Suspense fallback={<GoalsChartsGridSkeleton cards={4} />}>
            <GeneralGoalsCharts resident={resident} />
          </Suspense>
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
            <DashboardMetricCarousel
              items={[
                {
                  label: "Saldo livre",
                  value: formatCurrency(personalSummary!.safeToSpendCents / 100),
                  description: "Quanto ainda cabe no seu fluxo pessoal.",
                  accentClass: "bg-neo-yellow"
                },
                {
                  label: "Categorias estouradas",
                  value: String(goalsExceeded),
                  description: "Metas que ja passaram do limite definido.",
                  accentClass: "bg-neo-pink"
                },
                {
                  label: "Contas urgentes",
                  value: String(urgentPersonalBills),
                  description: "Pendencias com vencimento mais proximo.",
                  accentClass: "bg-neo-lime"
                }
              ]}
            />
          </div>

          <BudgetGoals bills={personalSnapshot!.weeklyBills} goals={personalSnapshot!.goals} />

          <Suspense fallback={<GoalsChartsGridSkeleton cards={2} />}>
            <PersonalGoalsCharts resident={resident} />
          </Suspense>
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
            <DashboardMetricCarousel
              items={[
                {
                  label: "Saude financeira",
                  value: houseSnapshot!.healthStatus,
                  description: houseSnapshot!.healthDescription,
                  accentClass: "bg-white"
                },
                {
                  label: "Caixa livre",
                  value: formatCurrency(houseSummary!.safeToSpendCents / 100),
                  description: "Saldo compartilhado depois das contas do mes.",
                  accentClass: "bg-neo-cyan"
                },
                {
                  label: "Contas urgentes",
                  value: String(urgentHouseBills),
                  description: "Pendencias que pedem acao rapida da casa.",
                  accentClass: "bg-neo-lime"
                }
              ]}
            />
          </div>

          <Suspense fallback={<GoalsChartsGridSkeleton cards={2} />}>
            <HouseGoalsCharts resident={resident} />
          </Suspense>
        </>
      ) : null}
    </div>
  );
}
