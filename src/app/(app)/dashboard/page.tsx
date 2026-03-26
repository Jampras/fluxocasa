import type { Route } from "next";
import { redirect } from "next/navigation";

import { DashboardMetricCarousel } from "@/components/dashboard/DashboardMetricCarousel";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { InteractiveCalendarSection } from "@/components/calendario/InteractiveCalendarSection";
import { AppHeader } from "@/components/layout/AppHeader";
import { formatCurrency } from "@/lib/utils";
import { requireCurrentResident } from "@/server/auth/user";
import { getInteractiveCalendarView } from "@/server/services/calendar.service";
import { getDashboardSnapshot } from "@/server/services/dashboard.service";

function getLegacyRedirect(tab: string, focus?: string): Route {
  const params = new URLSearchParams({ tab });

  if (focus) {
    params.set("focus", focus);
  }

  return `/gerenciar?${params.toString()}${focus ? `#${focus}` : ""}` as Route;
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string; focus?: string }>;
}) {
  const resolvedParams = await searchParams;

  if (resolvedParams.tab === "casa" || resolvedParams.tab === "pessoal") {
    redirect(getLegacyRedirect(resolvedParams.tab, resolvedParams.focus));
  }

  const user = await requireCurrentResident();
  const [snapshot, calendarView] = await Promise.all([
    getDashboardSnapshot(user.id),
    getInteractiveCalendarView(user.id, "geral")
  ]);

  return (
    <div className="min-h-screen w-full space-y-6 pb-16 sm:space-y-8 sm:pb-20">
      <AppHeader monthLabel={snapshot.monthLabel} userName={user.nome} />

      <DashboardMetricCarousel
        items={[
          {
            label: "Caixa da casa",
            value: formatCurrency(snapshot.houseCash),
            description: "Compartilhado",
            accentClass: "bg-neo-cyan"
          },
          {
            label: "Carteira pessoal",
            value: formatCurrency(snapshot.privateWallet),
            description: "Privado",
            accentClass: "bg-neo-yellow"
          },
          {
            label: "Pendencias",
            value: String(snapshot.pendingBills),
            description: "Aguardando",
    accentClass: "bg-neo-cream"
          },
          {
            label: "Anotacoes",
            value: String(snapshot.notesCount),
            description: "No mural",
            accentClass: "bg-neo-lime"
          }
        ]}
      />

      <InteractiveCalendarSection
        view={calendarView}
        actionHref="/gerenciar"
        title="Calendario"
        description={null}
        actionLabel="Abrir"
      />

      <RecentActivity items={snapshot.activity} />
    </div>
  );
}
