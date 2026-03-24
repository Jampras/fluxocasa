import { ContributionsList } from "@/components/casa/ContributionsList";
import { HouseBillsSection } from "@/components/casa/HouseBillsSection";
import { HouseOverview } from "@/components/casa/HouseOverview";
import { HouseActions } from "@/components/forms/HouseActions";
import { PersonalActions } from "@/components/forms/PersonalActions";
import { HouseHistorySection } from "@/components/gerenciar/HouseHistorySection";
import { ManageSectionNav } from "@/components/gerenciar/ManageSectionNav";
import { ManageTabs } from "@/components/gerenciar/ManageTabs";
import { PersonalHistorySection } from "@/components/gerenciar/PersonalHistorySection";
import { AppHeader } from "@/components/layout/AppHeader";
import { BudgetGoals } from "@/components/pessoal/BudgetGoals";
import { PersonalOverview } from "@/components/pessoal/PersonalOverview";
import { requireCurrentResident } from "@/server/auth/user";
import { getHouseSnapshot } from "@/server/services/house.service";
import { getPersonalSnapshot } from "@/server/services/personal.service";
import { getResidentsSnapshot } from "@/server/services/residents.service";

type ManageTab = "casa" | "pessoal";

function resolveManageTab(tab?: string): ManageTab {
  return tab === "pessoal" ? "pessoal" : "casa";
}

export default async function GerenciarPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireCurrentResident();
  const resolvedParams = await searchParams;
  const activeTab = resolveManageTab(resolvedParams.tab);

  if (activeTab === "pessoal") {
    const snapshot = await getPersonalSnapshot(user.id);

    return (
      <div className="min-h-screen w-full space-y-6 pb-16 sm:space-y-8 sm:pb-20">
        <AppHeader monthLabel={snapshot.monthLabel} title="Gerenciar" eyebrow="Painel operacional" />
        <ManageTabs currentTab={activeTab} />

        <div className="space-y-1.5 sm:space-y-2">
          <p className="font-heading text-[10px] uppercase tracking-[0.2em] text-neo-pink sm:text-sm sm:tracking-[0.3em]">
            Fluxo pessoal
          </p>
          <p className="font-body text-sm font-bold uppercase tracking-[0.12em] text-neo-dark/75 sm:text-base sm:tracking-wide">
            Cadastre, edite e acompanhe renda, contas, gastos, metas e historico pessoal.
          </p>
        </div>

        <ManageSectionNav
          title="Atalhos do fluxo pessoal"
          items={[
            { id: "personal-overview", label: "Resumo" },
            { id: "personal-create-income", label: "Renda" },
            { id: "personal-create-bill", label: "Contas" },
            { id: "personal-create-expense", label: "Gastos" },
            { id: "personal-create-goal", label: "Metas" },
            { id: "personal-history", label: "Historico" }
          ]}
        />

        <div id="personal-overview" className="grid gap-4 sm:gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <PersonalOverview snapshot={snapshot} />
          <BudgetGoals bills={snapshot.weeklyBills} goals={snapshot.goals} />
        </div>

        <PersonalActions
          incomes={snapshot.incomes}
          personalBills={snapshot.personalBills}
          expenses={snapshot.expenses}
          goals={snapshot.goals}
        />

        <div id="personal-history">
          <PersonalHistorySection incomes={snapshot.incomes} expenses={snapshot.expenses} />
        </div>
      </div>
    );
  }

  const [snapshot, residents] = await Promise.all([getHouseSnapshot(user.id), getResidentsSnapshot(user.id)]);

  return (
    <div className="min-h-screen w-full space-y-6 pb-16 sm:space-y-8 sm:pb-20">
      <AppHeader monthLabel={snapshot.monthLabel} title="Gerenciar" eyebrow="Painel operacional" />
      <ManageTabs currentTab={activeTab} />

      <div className="space-y-1.5 sm:space-y-2">
        <p className="font-heading text-[10px] uppercase tracking-[0.2em] text-neo-pink sm:text-sm sm:tracking-[0.3em]">
          Fluxo da casa
        </p>
        <p className="font-body text-sm font-bold uppercase tracking-[0.12em] text-neo-dark/75 sm:text-base sm:tracking-wide">
          Centralize contribuicoes, contas, historico e manutencao do caixa compartilhado.
        </p>
      </div>

      <ManageSectionNav
        title="Atalhos do fluxo da casa"
        items={[
          { id: "house-overview", label: "Resumo" },
          { id: "house-contribution", label: "Contribuicao" },
          { id: "house-create-bill", label: "Nova conta" },
          { id: "house-manage-bills", label: "Pendencias" },
          { id: "house-history", label: "Historico" }
        ]}
      />

      <div id="house-overview">
        <HouseOverview snapshot={snapshot} />
      </div>
      <HouseActions contributions={snapshot.contributions} bills={[...snapshot.pendingBills, ...snapshot.paidBills]} />
      <div id="house-contributions">
        <ContributionsList items={snapshot.contributions} />
      </div>
      <HouseBillsSection title="Contas Pendentes" items={snapshot.pendingBills} elevated allowMarkAsPaid />
      <div id="house-history">
        <HouseHistorySection paidBills={snapshot.paidBills} auditLog={residents.auditLog} />
      </div>
    </div>
  );
}
