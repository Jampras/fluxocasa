import { AppHeader } from "@/components/layout/AppHeader";
import { ResidentsPanel } from "@/components/moradores/ResidentsPanel";
import { requireCurrentResident } from "@/server/auth/user";
import { getResidentsSnapshot } from "@/server/services/residents.service";

export default async function MoradoresPage() {
  const user = await requireCurrentResident();
  const snapshot = await getResidentsSnapshot(user.id);

  return (
    <div className="space-y-8">
      <AppHeader monthLabel={snapshot.monthLabel} title="Moradores" />
      <ResidentsPanel snapshot={snapshot} />
    </div>
  );
}
