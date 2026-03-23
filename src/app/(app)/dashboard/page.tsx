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
      <div className="min-h-screen w-full space-y-8 pb-20">
        <AppHeader monthLabel={snapshot.monthLabel} userName={user.nome} />
        <PanelTabs currentTab={activeTab} />

        <div className="space-y-2">
          <p className="font-heading text-sm uppercase tracking-[0.3em] text-neo-pink">
            Painel da casa
          </p>
          <p className="font-body text-base font-bold uppercase tracking-wide text-neo-dark/75">
            Tudo do fluxo compartilhado em uma tela: caixa, contribuicoes, contas e historico.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
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
      <div className="min-h-screen w-full space-y-8 pb-20">
        <AppHeader monthLabel={snapshot.monthLabel} userName={user.nome} />
        <PanelTabs currentTab={activeTab} />

        <div className="space-y-2">
          <p className="font-heading text-sm uppercase tracking-[0.3em] text-neo-pink">
            Painel pessoal
          </p>
          <p className="font-body text-base font-bold uppercase tracking-wide text-neo-dark/75">
            Sua carteira, metas e contas agora ficam reunidas no mesmo fluxo.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
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
    <div className="min-h-screen w-full space-y-8 pb-20">
      <AppHeader monthLabel={snapshot.monthLabel} userName={user.nome} />
      <PanelTabs currentTab={activeTab} />

      <div className="space-y-2">
        <p className="font-heading text-sm uppercase tracking-[0.3em] text-neo-pink">
          Painel geral
        </p>
        <p className="font-body text-base font-bold uppercase tracking-wide text-neo-dark/75">
          A pagina inicial mostra o que mudou na casa e no pessoal sem obrigar troca de menu.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <NeoCard className="bg-neo-cyan p-6">
          <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-dark/70">
            Caixa da casa
          </p>
          <h2 className="mt-4 font-heading text-5xl uppercase text-neo-dark">
            {formatCurrency(snapshot.houseCash)}
          </h2>
          <p className="mt-2 font-body text-sm font-bold uppercase tracking-wide text-neo-dark/65">
            Saldo compartilhado projetado.
          </p>
        </NeoCard>
        <NeoCard className="bg-neo-yellow p-6">
          <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-dark/70">
            Carteira pessoal
          </p>
          <h2 className="mt-4 font-heading text-5xl uppercase text-neo-dark">
            {formatCurrency(snapshot.privateWallet)}
          </h2>
          <p className="mt-2 font-body text-sm font-bold uppercase tracking-wide text-neo-dark/65">
            Margem disponivel no seu fluxo privado.
          </p>
        </NeoCard>
        <NeoCard className="bg-white p-6">
          <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">Pendencias</p>
          <h2 className="mt-4 font-heading text-5xl uppercase text-neo-dark">
            {snapshot.pendingBills}
          </h2>
          <p className="mt-2 font-body text-sm font-bold uppercase tracking-wide text-neo-dark/65">
            Contas da casa aguardando acao.
          </p>
        </NeoCard>
        <NeoCard className="bg-neo-lime p-6">
          <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-dark/70">
            Metas ativas
          </p>
          <h2 className="mt-4 font-heading text-5xl uppercase text-neo-dark">{snapshot.goalsHit}</h2>
          <p className="mt-2 font-body text-sm font-bold uppercase tracking-wide text-neo-dark/65">
            Categorias dentro do limite mensal.
          </p>
        </NeoCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <NeoCard className="space-y-6 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">
                Casa agora
              </p>
              <h2 className="mt-2 font-heading text-4xl uppercase text-neo-dark">Fluxo compartilhado</h2>
            </div>
            <Link
              href="/dashboard?tab=casa"
              className="border-4 border-neo-dark bg-neo-yellow px-4 py-3 font-heading text-lg uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1"
            >
              Abrir aba
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <NeoCard className="bg-neo-cyan p-5">
              <p className="font-heading text-sm uppercase tracking-[0.2em] text-neo-dark/70">
                Saldo livre
              </p>
              <p className="mt-3 font-heading text-4xl uppercase text-neo-dark">
                {formatCurrency(houseVisualization.safeToSpendCents / 100)}
              </p>
            </NeoCard>
            <NeoCard className="bg-neo-pink p-5 text-white">
              <p className="font-heading text-sm uppercase tracking-[0.2em] text-white/75">
                Contas pendentes
              </p>
              <p className="mt-3 font-heading text-4xl uppercase text-white">
                {houseVisualization.pendingCount}
              </p>
            </NeoCard>
          </div>
          <DonutChartPreview
            title="Contas da casa"
            totalLabel={`Total monitorado: ${formatCurrency(
              houseVisualization.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
            )}`}
            segments={houseVisualization.donutData}
          />
        </NeoCard>

        <NeoCard className="space-y-6 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">
                Pessoal agora
              </p>
              <h2 className="mt-2 font-heading text-4xl uppercase text-neo-dark">Fluxo privado</h2>
            </div>
            <Link
              href="/dashboard?tab=pessoal"
              className="border-4 border-neo-dark bg-neo-cyan px-4 py-3 font-heading text-lg uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1"
            >
              Abrir aba
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <NeoCard className="bg-neo-yellow p-5">
              <p className="font-heading text-sm uppercase tracking-[0.2em] text-neo-dark/70">
                Saldo livre
              </p>
              <p className="mt-3 font-heading text-4xl uppercase text-neo-dark">
                {formatCurrency(personalVisualization.safeToSpendCents / 100)}
              </p>
            </NeoCard>
            <NeoCard className="bg-neo-lime p-5">
              <p className="font-heading text-sm uppercase tracking-[0.2em] text-neo-dark/70">
                Pendencias
              </p>
              <p className="mt-3 font-heading text-4xl uppercase text-neo-dark">
                {personalVisualization.pendingCount}
              </p>
            </NeoCard>
          </div>
          <DonutChartPreview
            title="Gastos pessoais"
            totalLabel={`Total monitorado: ${formatCurrency(
              personalVisualization.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
            )}`}
            segments={personalVisualization.donutData}
          />
        </NeoCard>
      </div>

      <NeoCard className="space-y-4 bg-white p-6">
        <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">Insight do mes</p>
        <h2 className="font-heading text-4xl uppercase text-neo-dark">{snapshot.insight.title}</h2>
        <p className="font-body text-base font-bold text-neo-dark/70">
          {snapshot.insight.description}
        </p>
        <a
          href={snapshot.insight.actionHref}
          className="inline-flex items-center justify-center border-4 border-neo-dark bg-neo-yellow px-6 py-4 font-heading text-2xl uppercase text-neo-dark shadow-[6px_6px_0_#B88C00] transition-all hover:-translate-y-1"
        >
          {snapshot.insight.actionLabel}
        </a>
      </NeoCard>

      <RecentActivity items={snapshot.activity} />
    </div>
  );
}
