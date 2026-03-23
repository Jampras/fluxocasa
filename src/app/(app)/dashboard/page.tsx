import Link from "next/link";
import type { Route } from "next";
import { EscopoTransacao } from "@prisma/client";

import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { AppHeader } from "@/components/layout/AppHeader";
import { NeoCard } from "@/components/ui/NeoCard";
import { ContextToggle } from "@/components/ui/ContextToggle";
import { DonutChartPreview } from "@/components/ui/DonutChartPreview";
import { WaterfallChartPreview } from "@/components/ui/WaterfallChartPreview";
import { ROUTES } from "@/config/routes";
import { formatCurrency } from "@/lib/utils";
import { getDashboardVisualization } from "@/server/actions/transactions";
import { requireCurrentResident } from "@/server/auth/user";
import { getDashboardSnapshot } from "@/server/services/dashboard.service";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const resolvedParams = await searchParams;
  const user = await requireCurrentResident();
  const scope: EscopoTransacao =
    resolvedParams.scope === "home" ? EscopoTransacao.CASA : EscopoTransacao.PESSOAL;

  const [snapshot, visualization] = await Promise.all([
    getDashboardSnapshot(user.id),
    getDashboardVisualization(scope)
  ]);

  const scopeLabel = scope === EscopoTransacao.CASA ? "Casa" : "Pessoal";
  const pendingRoute = scope === EscopoTransacao.CASA ? ROUTES.casa : ROUTES.pessoal;
  const pendingLabel =
    scope === EscopoTransacao.CASA
      ? "Contas compartilhadas pendentes"
      : "Contas pessoais pendentes";
  const insightRoute = snapshot.insight.actionHref as Route;

  return (
    <div className="min-h-screen w-full animate-fade-in space-y-8 pb-20">
      <AppHeader monthLabel={snapshot.monthLabel} userName={user.nome} />

      <div className="space-y-3">
        <p className="font-heading text-sm uppercase tracking-[0.3em] text-neo-pink">Visao geral</p>
        <p className="font-body text-lg font-bold uppercase tracking-wide text-neo-dark">
          O foco agora esta em {scopeLabel.toLowerCase()}, com dados reais deste mes.
        </p>
      </div>

      <ContextToggle />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <NeoCard className="col-span-1 flex flex-col justify-between gap-6 bg-neo-cyan p-8 md:col-span-2 lg:col-span-3 md:flex-row md:items-center md:p-12">
          <div>
            <p className="font-heading text-2xl uppercase tracking-[0.22em] text-neo-dark/70">
              Saldo livre
            </p>
            <h1 className="mt-3 font-heading text-6xl uppercase text-neo-dark md:text-8xl lg:text-9xl">
              {formatCurrency(visualization.safeToSpendCents / 100)}
            </h1>
            <p className="mt-3 max-w-2xl font-body text-base font-bold uppercase tracking-wide text-neo-dark/70">
              Entradas e saidas consolidadas do contexto atual, incluindo o que ja foi assumido.
            </p>
          </div>

          <div className="shrink-0">
            <p className="border-4 border-neo-dark bg-white px-6 py-4 font-heading text-3xl uppercase text-neo-dark shadow-[6px_6px_0_#FF2A85] md:text-4xl">
              {visualization.safeToSpendCents >= 0 ? "Com margem" : "Pede ajuste"}
            </p>
          </div>
        </NeoCard>

        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <DonutChartPreview
            title={scope === EscopoTransacao.CASA ? "Mapa das contas" : "Mapa dos gastos"}
            totalLabel={`Total monitorado: ${formatCurrency(
              visualization.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
            )}`}
            segments={visualization.donutData}
          />
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-2">
          <WaterfallChartPreview
            title={
              scope === EscopoTransacao.CASA
                ? "Fluxo do caixa compartilhado"
                : "Fluxo da carteira pessoal"
            }
            subtitle="Ultimos movimentos do mes em ordem cronologica."
            steps={visualization.waterfallData}
          />
        </div>

        <NeoCard className="col-span-1 flex flex-col justify-between gap-4 bg-neo-pink p-8 text-white md:col-span-2 lg:col-span-1">
          <div>
            <p className="font-heading text-sm uppercase tracking-[0.28em] text-white/80">
              Ponto de atencao
            </p>
            <h2 className="mt-3 font-heading text-4xl uppercase text-white">{pendingLabel}</h2>
            <p className="mt-3 font-body text-base font-bold uppercase tracking-wide text-white/80">
              {visualization.pendingCount} item(ns) aguardando acao.
            </p>
          </div>
          <Link
            href={pendingRoute}
            className="inline-flex items-center justify-center border-4 border-neo-dark bg-white px-8 py-4 font-heading text-3xl uppercase text-neo-dark shadow-[8px_8px_0_#0F172A] transition-all hover:-translate-y-1"
          >
            Ver contas
          </Link>
        </NeoCard>

        <NeoCard className="col-span-1 flex flex-col justify-between gap-6 bg-white p-8 md:col-span-2 lg:col-span-2">
          <div className="space-y-2">
            <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">
              Insight do mes
            </p>
            <h2 className="font-heading text-4xl uppercase text-neo-dark">{snapshot.insight.title}</h2>
            <p className="max-w-3xl font-body text-base font-bold text-neo-dark/70">
              {snapshot.insight.description}
            </p>
          </div>
          <div>
            <Link
              href={insightRoute}
              className="inline-flex items-center justify-center border-4 border-neo-dark bg-neo-yellow px-8 py-4 font-heading text-3xl uppercase text-neo-dark shadow-[8px_8px_0_#B88C00] transition-all hover:-translate-y-1"
            >
              {snapshot.insight.actionLabel}
            </Link>
          </div>
        </NeoCard>
      </div>

      <RecentActivity items={snapshot.activity} />
    </div>
  );
}
