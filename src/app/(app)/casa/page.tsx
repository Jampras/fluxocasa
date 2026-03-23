import { ContributionsList } from "@/components/casa/ContributionsList";
import { HouseActions } from "@/components/forms/HouseActions";
import { HouseBillsSection } from "@/components/casa/HouseBillsSection";
import { HouseOverview } from "@/components/casa/HouseOverview";
import { AppHeader } from "@/components/layout/AppHeader";
import { requireCurrentResident } from "@/server/auth/user";
import { getHouseSnapshot } from "@/server/services/house.service";

export default async function CasaPage() {
  const user = await requireCurrentResident();
  const snapshot = await getHouseSnapshot(user.id);

  return (
    <div className="space-y-8">
      <AppHeader
        monthLabel={snapshot.monthLabel}
        eyebrow="Ambiente compartilhado"
        title={snapshot.houseName}
      />
      <HouseOverview snapshot={snapshot} />
      <HouseActions contributions={snapshot.contributions} bills={[...snapshot.pendingBills, ...snapshot.paidBills]} />
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
