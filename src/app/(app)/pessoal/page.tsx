import { AppHeader } from "@/components/layout/AppHeader";
import { PersonalActions } from "@/components/forms/PersonalActions";
import { BudgetGoals } from "@/components/pessoal/BudgetGoals";
import { PersonalOverview } from "@/components/pessoal/PersonalOverview";
import { requireCurrentResident } from "@/server/auth/user";
import { getPersonalSnapshot } from "@/server/services/personal.service";

export default async function PessoalPage() {
  const user = await requireCurrentResident();
  const snapshot = await getPersonalSnapshot(user.id);

  return (
    <div className="space-y-8">
      <AppHeader
        monthLabel={snapshot.monthLabel}
        eyebrow="Ambiente privado"
        title="Meu Perfil"
      />
      <PersonalOverview snapshot={snapshot} />
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
