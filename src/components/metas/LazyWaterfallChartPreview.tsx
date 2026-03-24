"use client";

import type { ComponentProps } from "react";
import dynamic from "next/dynamic";

import { ChartCardSkeleton } from "@/components/metas/ChartCardSkeleton";

const WaterfallChartPreview = dynamic(
  () => import("@/components/ui/WaterfallChartPreview").then((module) => module.WaterfallChartPreview),
  {
    ssr: false,
    loading: () => (
      <ChartCardSkeleton
        title="Carregando fluxo"
        subtitle="Montando a linha de entradas e saidas."
      />
    )
  }
);

export function LazyWaterfallChartPreview(props: ComponentProps<typeof WaterfallChartPreview>) {
  return <WaterfallChartPreview {...props} />;
}
