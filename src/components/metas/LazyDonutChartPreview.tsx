"use client";

import type { ComponentProps } from "react";
import dynamic from "next/dynamic";

import { ChartCardSkeleton } from "@/components/metas/ChartCardSkeleton";

const DonutChartPreview = dynamic(
  () => import("@/components/ui/DonutChartPreview").then((module) => module.DonutChartPreview),
  {
    ssr: false,
    loading: () => (
      <ChartCardSkeleton
        title="Carregando distribuicao"
        subtitle="Preparando a leitura visual das categorias."
        accentClass="bg-neo-yellow"
      />
    )
  }
);

export function LazyDonutChartPreview(props: ComponentProps<typeof DonutChartPreview>) {
  return <DonutChartPreview {...props} />;
}
