import Link from "next/link";
import { EscopoTransacao } from "@prisma/client";

import { ContributionsList } from "@/components/casa/ContributionsList";
import { HouseBillsSection } from "@/components/casa/HouseBillsSection";
import { HouseOverview } from "@/components/casa/HouseOverview";
import { PanelTabs } from "@/components/dashboard/PanelTabs";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { HouseActions } from "@/components/forms/HouseActions";
import { PersonalActions } from "@/components/forms/PersonalActions";
import { AppHeader } from "@/components/layout/AppHeader";
import { BudgetGoals } from "@/components/pessoal/BudgetGoals";
import { PersonalOverview } from "@/components/pessoal/PersonalOverview";
import { DonutChartPreview } from "@/components/ui/DonutChartPreview";
import { NeoCard } from "@/components/ui/NeoCard";
import { WaterfallChartPreview } from "@/components/ui/WaterfallChartPreview";
import { formatCurrency } from "@/lib/utils";
import { getDashboardVisualization } from "@/server/actions/transactions";
import { requireCurrentResident } from "@/server/auth/user";
import { getDashboardSnapshot } from "@/server/services/dashboard.service";
import { getHouseSnapshot } from "@/server/services/house.service";
import { getPersonalSnapshot } from "@/server/services/personal.service";

type PanelTab = "geral" | "casa" | "pessoal";

function resolvePanelTab(tab?: string): PanelTab {
  if (tab === "casa" || tab === "pessoal") {
    return tab;
  }

  return "geral";
}

function SummaryMetricCard({
  label,
  value,
  description,
  accentClass
}: {
  label: string;
  value: string;
  description: string;
  accentClass: string;
}) {
  return (
    <NeoCard className="overflow-hidden bg-white p-0 lg:min-h-[214px]">
      <div className={`border-b-[3px] border-neo-dark px-3 py-2 sm:border-b-4 sm:px-4 sm:py-3 ${accentClass}`}>
        <p className="font-heading text-[10px] uppercase tracking-[0.14em] text-neo-dark sm:text-sm sm:tracking-[0.22em]">
          {label}
        </p>
      </div>
      <div className="space-y-2 p-3 sm:p-4 md:p-5 lg:p-6">
        <h2 className="font-heading text-3xl uppercase leading-none text-neo-dark sm:text-4xl md:text-5xl xl:text-[3.25rem]">
          {value}
        </h2>
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.08em] text-neo-dark/65 sm:text-sm sm:tracking-[0.12em]">
          {description}
        </p>
      </div>
    </NeoCard>
  );
}

function FlowMetric({
  label,
  value,
  accentClass,
  valueClass = "text-neo-dark",
  labelClass = "text-neo-dark/70"
}: {
  label: string;
  value: string | number;
  accentClass: string;
  valueClass?: string;
  labelClass?: string;
}) {
  return (
    <div className={`border-[3px] border-neo-dark px-3 py-3 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:px-4 sm:py-4 ${accentClass}`}>
      <p className={`font-heading text-[10px] uppercase tracking-[0.12em] sm:text-sm sm:tracking-[0.18em] ${labelClass}`}>
        {label}
      </p>
      <p className={`mt-2 font-heading text-3xl uppercase leading-none sm:text-4xl ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string; focus?: string }>;
}) {
  const resolvedParams = await searchParams;
  const activeTab = resolvePanelTab(resolvedParams.tab);
  const user = await requireCurrentResident();
  const resident = { id: user.id, casaId: user.casaId };

  if (activeTab === "casa") {
    const [snapshot, visualization] = await Promise.all([
      getHouseSnapshot(user.id),
      getDashboardVisualization(EscopoTransacao.CASA, resident)
    ]);

    return (
      <div className="min-h-screen w-full space-y-6 pb-16 sm:space-y-8 sm:pb-20">
        <AppHeader monthLabel={snapshot.monthLabel} userName={user.nome} />
        <PanelTabs currentTab={activeTab} />

        <div className="space-y-1.5 sm:space-y-2">
          <p className="font-heading text-[10px] uppercase tracking-[0.2em] text-neo-pink sm:text-sm sm:tracking-[0.3em]">
            Painel da casa
          </p>
          <p className="font-body text-sm font-bold uppercase tracking-[0.12em] text-neo-dark/75 sm:text-base sm:tracking-wide">
            Tudo do fluxo compartilhado em uma tela: caixa, contribuicoes, contas e historico.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <HouseOverview snapshot={snapshot} />
          <div className="grid gap-6">
            <DonutChartPreview
              title="Distribuicao das contas"
              totalLabel={`Total monitorado: ${formatCurrency(
                visualization.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
              )}`}
              segments={visualization.donutData}
            />
            <WaterfallChartPreview
              title="Fluxo compartilhado"
              subtitle="Entradas de contribuicao e saidas da casa neste mes."
              steps={visualization.waterfallData}
            />
          </div>
        </div>

        <HouseActions
          contributions={snapshot.contributions}
          bills={[...snapshot.pendingBills, ...snapshot.paidBills]}
        />
        <ContributionsList items={snapshot.contributions} />
        <HouseBillsSection
          title="Contas Pendentes"
          items={snapshot.pendingBills}
          elevated
          allowMarkAsPaid
        />
        <HouseBillsSection title="Contas Pagas" items={snapshot.paidBills} />
      </div>
    );
  }

  if (activeTab === "pessoal") {
    const [snapshot, visualization] = await Promise.all([
      getPersonalSnapshot(user.id),
      getDashboardVisualization(EscopoTransacao.PESSOAL, resident)
    ]);

    return (
      <div className="min-h-screen w-full space-y-6 pb-16 sm:space-y-8 sm:pb-20">
        <AppHeader monthLabel={snapshot.monthLabel} userName={user.nome} />
        <PanelTabs currentTab={activeTab} />

        <div className="space-y-1.5 sm:space-y-2">
          <p className="font-heading text-[10px] uppercase tracking-[0.2em] text-neo-pink sm:text-sm sm:tracking-[0.3em]">
            Painel pessoal
          </p>
          <p className="font-body text-sm font-bold uppercase tracking-[0.12em] text-neo-dark/75 sm:text-base sm:tracking-wide">
            Sua carteira, metas e contas agora ficam reunidas no mesmo fluxo.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <PersonalOverview snapshot={snapshot} />
          <div className="grid gap-6">
            <DonutChartPreview
              title="Distribuicao dos gastos"
              totalLabel={`Total monitorado: ${formatCurrency(
                visualization.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
              )}`}
              segments={visualization.donutData}
            />
            <WaterfallChartPreview
              title="Fluxo pessoal"
              subtitle="Entradas, gastos e contas do mes em ordem cronologica."
              steps={visualization.waterfallData}
            />
          </div>
        </div>

        <PersonalActions
          incomes={snapshot.incomes}
          personalBills={snapshot.personalBills}
          expenses={snapshot.expenses}
          goals={snapshot.goals}
        />
        <BudgetGoals bills={snapshot.weeklyBills} goals={snapshot.goals} />
      </div>
    );
  }

  const [snapshot, houseVisualization, personalVisualization] = await Promise.all([
    getDashboardSnapshot(user.id),
    getDashboardVisualization(EscopoTransacao.CASA, resident),
    getDashboardVisualization(EscopoTransacao.PESSOAL, resident)
  ]);

  return (
    <div className="min-h-screen w-full space-y-6 pb-16 sm:space-y-8 sm:pb-20">
      <AppHeader monthLabel={snapshot.monthLabel} userName={user.nome} />
      <PanelTabs currentTab={activeTab} />

      <div className="space-y-4 lg:space-y-5">
        <div className="max-w-3xl space-y-1.5 sm:space-y-2">
          <p className="font-heading text-[10px] uppercase tracking-[0.2em] text-neo-pink sm:text-sm sm:tracking-[0.3em]">
            Painel geral
          </p>
          <p className="font-body text-sm font-bold uppercase tracking-[0.12em] text-neo-dark/75 sm:text-base sm:tracking-wide">
            A pagina inicial mostra o que mudou na casa e no pessoal sem obrigar troca de menu.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <SummaryMetricCard
            label="Caixa da casa"
            value={formatCurrency(snapshot.houseCash)}
            description="Saldo compartilhado projetado."
            accentClass="bg-neo-cyan"
          />
          <SummaryMetricCard
            label="Carteira pessoal"
            value={formatCurrency(snapshot.privateWallet)}
            description="Margem disponivel no seu fluxo privado."
            accentClass="bg-neo-yellow"
          />
          <SummaryMetricCard
            label="Pendencias"
            value={String(snapshot.pendingBills)}
            description="Contas da casa aguardando acao."
            accentClass="bg-white"
          />
          <SummaryMetricCard
            label="Metas ativas"
            value={String(snapshot.goalsHit)}
            description="Categorias dentro do limite mensal."
            accentClass="bg-neo-lime"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        <NeoCard className="overflow-hidden bg-white p-0">
          <div className="flex items-start justify-between gap-3 border-b-[3px] border-neo-dark bg-neo-cyan px-3 py-3 sm:border-b-4 sm:px-4 sm:py-4">
            <div>
              <p className="font-heading text-[10px] uppercase tracking-[0.16em] text-neo-dark/70 sm:text-sm sm:tracking-[0.28em]">
                Casa agora
              </p>
              <h2 className="mt-1.5 font-heading text-2xl uppercase text-neo-dark sm:text-3xl md:text-4xl">
                Fluxo compartilhado
              </h2>
            </div>
            <Link
              href="/dashboard?tab=casa"
              className="border-[3px] border-neo-dark bg-neo-yellow px-3 py-2 font-heading text-sm uppercase text-neo-dark shadow-[3px_3px_0_#0F172A] transition-all hover:-translate-y-1 sm:border-4 sm:px-4 sm:py-3 sm:text-base sm:shadow-[4px_4px_0_#0F172A]"
            >
              Abrir aba
            </Link>
          </div>
          <div className="grid gap-4 p-3 sm:gap-5 sm:p-4 md:p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <FlowMetric
                label="Saldo livre"
                value={formatCurrency(houseVisualization.safeToSpendCents / 100)}
                accentClass="bg-neo-yellow"
              />
              <FlowMetric
                label="Contas pendentes"
                value={houseVisualization.pendingCount}
                accentClass="bg-neo-pink"
                valueClass="text-white"
                labelClass="text-white/75"
              />
            </div>
            <DonutChartPreview
              title="Contas da casa"
              totalLabel={`Total monitorado: ${formatCurrency(
                houseVisualization.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
              )}`}
              segments={houseVisualization.donutData}
            />
          </div>
        </NeoCard>

        <NeoCard className="overflow-hidden bg-white p-0">
          <div className="flex items-start justify-between gap-3 border-b-[3px] border-neo-dark bg-neo-yellow px-3 py-3 sm:border-b-4 sm:px-4 sm:py-4">
            <div>
              <p className="font-heading text-[10px] uppercase tracking-[0.16em] text-neo-dark/70 sm:text-sm sm:tracking-[0.28em]">
                Pessoal agora
              </p>
              <h2 className="mt-1.5 font-heading text-2xl uppercase text-neo-dark sm:text-3xl md:text-4xl">
                Fluxo privado
              </h2>
            </div>
            <Link
              href="/dashboard?tab=pessoal"
              className="border-[3px] border-neo-dark bg-neo-cyan px-3 py-2 font-heading text-sm uppercase text-neo-dark shadow-[3px_3px_0_#0F172A] transition-all hover:-translate-y-1 sm:border-4 sm:px-4 sm:py-3 sm:text-base sm:shadow-[4px_4px_0_#0F172A]"
            >
              Abrir aba
            </Link>
          </div>
          <div className="grid gap-4 p-3 sm:gap-5 sm:p-4 md:p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <FlowMetric
                label="Saldo livre"
                value={formatCurrency(personalVisualization.safeToSpendCents / 100)}
                accentClass="bg-neo-cyan"
              />
              <FlowMetric
                label="Pendencias"
                value={personalVisualization.pendingCount}
                accentClass="bg-neo-lime"
              />
            </div>
            <DonutChartPreview
              title="Gastos pessoais"
              totalLabel={`Total monitorado: ${formatCurrency(
                personalVisualization.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
              )}`}
              segments={personalVisualization.donutData}
            />
          </div>
        </NeoCard>
      </div>

      <NeoCard className="bg-white p-4 sm:p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="font-heading text-[10px] uppercase tracking-[0.16em] text-neo-pink sm:text-sm sm:tracking-[0.28em]">
              Insight do mes
            </p>
            <h2 className="font-heading text-2xl uppercase text-neo-dark sm:text-3xl md:text-4xl">
              {snapshot.insight.title}
            </h2>
            <p className="max-w-2xl font-body text-sm font-bold text-neo-dark/70 sm:text-base">
              {snapshot.insight.description}
            </p>
          </div>
          <a
            href={snapshot.insight.actionHref}
            className="inline-flex items-center justify-center border-[3px] border-neo-dark bg-neo-yellow px-4 py-3 font-heading text-lg uppercase text-neo-dark shadow-[4px_4px_0_#B88C00] transition-all hover:-translate-y-1 sm:border-4 sm:px-6 sm:py-4 sm:text-2xl sm:shadow-[6px_6px_0_#B88C00]"
          >
            {snapshot.insight.actionLabel}
          </a>
        </div>
      </NeoCard>

      <RecentActivity items={snapshot.activity} />
    </div>
  );
}
