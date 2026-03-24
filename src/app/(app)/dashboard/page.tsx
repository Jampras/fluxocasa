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

      <div className="space-y-4 lg:space-y-5">
        <div className="max-w-3xl space-y-1.5 sm:space-y-2">
          <p className="font-heading text-[10px] uppercase tracking-[0.2em] text-neo-pink sm:text-sm sm:tracking-[0.3em]">
            Painel principal
          </p>
          <p className="font-body text-sm font-bold uppercase tracking-[0.12em] text-neo-dark/75 sm:text-base sm:tracking-wide">
            Cards, calendario interativo e historico geral em uma tela so.
          </p>
        </div>

        <DashboardMetricCarousel
          items={[
            {
              label: "Caixa da casa",
              value: formatCurrency(snapshot.houseCash),
              description: "Saldo compartilhado projetado.",
              accentClass: "bg-neo-cyan"
            },
            {
              label: "Carteira pessoal",
              value: formatCurrency(snapshot.privateWallet),
              description: "Margem disponivel no seu fluxo privado.",
              accentClass: "bg-neo-yellow"
            },
            {
              label: "Pendencias",
              value: String(snapshot.pendingBills),
              description: "Contas da casa aguardando acao.",
              accentClass: "bg-white"
            },
            {
              label: "Metas ativas",
              value: String(snapshot.goalsHit),
              description: "Categorias dentro do limite mensal.",
              accentClass: "bg-neo-lime"
            }
          ]}
        />
      </div>

      <InteractiveCalendarSection
        view={calendarView}
        actionHref="/gerenciar"
        title="Calendario interativo"
        description="Visao geral consolidada com contas, recebimentos e gastos do mes."
        actionLabel="Gerenciar"
      />

      <RecentActivity items={snapshot.activity} />
    </div>
  );
}
