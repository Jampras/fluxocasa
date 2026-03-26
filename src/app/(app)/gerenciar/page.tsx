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
import { PersonalOverview } from "@/components/pessoal/PersonalOverview";
import { requireCurrentResident } from "@/server/auth/user";
import { getHouseSnapshot } from "@/server/services/house.service";
import { getPersonalSnapshot } from "@/server/services/personal.service";

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
        <AppHeader monthLabel={snapshot.monthLabel} title="Gerenciar" />
        <ManageTabs currentTab={activeTab} />

        <ManageSectionNav
          items={[
            { id: "personal-create-income", label: "Renda" },
            { id: "personal-create-bill", label: "Contas" },
            { id: "personal-create-expense", label: "Gastos" },
            { id: "personal-history", label: "Historico" }
          ]}
        />

        <div id="personal-overview">
          <PersonalOverview snapshot={snapshot} />
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

  const snapshot = await getHouseSnapshot(user.id);

  return (
    <div className="min-h-screen w-full space-y-6 pb-16 sm:space-y-8 sm:pb-20">
      <AppHeader monthLabel={snapshot.monthLabel} title="Gerenciar" />
      <ManageTabs currentTab={activeTab} />

      <ManageSectionNav
        items={[
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
        <HouseHistorySection paidBills={snapshot.paidBills} />
      </div>
    </div>
  );
}
