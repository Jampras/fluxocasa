import { EscopoTransacao } from "@prisma/client";

import { LazyDonutChartPreview } from "@/components/metas/LazyDonutChartPreview";
import { LazyWaterfallChartPreview } from "@/components/metas/LazyWaterfallChartPreview";
import { ChartCardSkeleton } from "@/components/metas/ChartCardSkeleton";
import { formatCurrency } from "@/lib/utils";
import { getDashboardVisualization } from "@/server/actions/transactions";

interface GoalsChartsProps {
  resident: {
    id: string;
    casaId: string | null;
  };
}

export function GoalsChartsGridSkeleton({ cards }: { cards: number }) {
  const items = Array.from({ length: cards }, (_, index) => index);

  return (
    <div className="grid gap-4 sm:gap-6 xl:grid-cols-2 2xl:grid-cols-[1fr_1fr]">
      {items.map((item) => (
        <ChartCardSkeleton
          key={item}
          title={item % 2 === 0 ? "Carregando distribuicao" : "Carregando fluxo"}
          subtitle="Montando os dados desta visao."
          accentClass={item < 2 ? "bg-neo-yellow" : "bg-white"}
        />
      ))}
    </div>
  );
}

export async function GeneralGoalsCharts({ resident }: GoalsChartsProps) {
  const [personalVisualization, houseVisualization] = await Promise.all([
    getDashboardVisualization(EscopoTransacao.PESSOAL, resident),
    getDashboardVisualization(EscopoTransacao.CASA, resident)
  ]);

  return (
    <div className="grid gap-4 sm:gap-6 xl:grid-cols-2 2xl:grid-cols-[1fr_1fr]">
      <LazyDonutChartPreview
        title="Distribuicao dos gastos pessoais"
        totalLabel={`Total monitorado: ${formatCurrency(
          personalVisualization.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
        )}`}
        segments={personalVisualization.donutData}
      />
      <LazyDonutChartPreview
        title="Distribuicao das contas da casa"
        totalLabel={`Total monitorado: ${formatCurrency(
          houseVisualization.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
        )}`}
        segments={houseVisualization.donutData}
      />
      <LazyWaterfallChartPreview
        title="Fluxo pessoal"
        subtitle="Evolucao de entradas e saidas mais recentes."
        steps={personalVisualization.waterfallData}
      />
      <LazyWaterfallChartPreview
        title="Fluxo da casa"
        subtitle="Evolucao do caixa compartilhado em ordem cronologica."
        steps={houseVisualization.waterfallData}
      />
    </div>
  );
}

export async function PersonalGoalsCharts({ resident }: GoalsChartsProps) {
  const personalVisualization = await getDashboardVisualization(EscopoTransacao.PESSOAL, resident);

  return (
    <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
      <LazyDonutChartPreview
        title="Distribuicao dos gastos pessoais"
        totalLabel={`Total monitorado: ${formatCurrency(
          personalVisualization.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
        )}`}
        segments={personalVisualization.donutData}
      />
      <LazyWaterfallChartPreview
        title="Fluxo pessoal"
        subtitle="Evolucao de entradas, contas e gastos."
        steps={personalVisualization.waterfallData}
      />
    </div>
  );
}

export async function HouseGoalsCharts({ resident }: GoalsChartsProps) {
  const houseVisualization = await getDashboardVisualization(EscopoTransacao.CASA, resident);

  return (
    <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
      <LazyDonutChartPreview
        title="Distribuicao das contas da casa"
        totalLabel={`Total monitorado: ${formatCurrency(
          houseVisualization.donutData.reduce((sum, item) => sum + item.valueCents, 0) / 100
        )}`}
        segments={houseVisualization.donutData}
      />
      <LazyWaterfallChartPreview
        title="Fluxo da casa"
        subtitle="Contribuicoes e contas compartilhadas em ordem cronologica."
        steps={houseVisualization.waterfallData}
      />
    </div>
  );
}
