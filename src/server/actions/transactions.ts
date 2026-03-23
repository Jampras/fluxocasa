"use server";

import { revalidatePath } from "next/cache";
import { EscopoTransacao, StatusTransacao, TipoTransacao } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireCurrentResident } from "@/server/auth/user";
import { createExpense, createIncome } from "@/server/services/personal.service";
import { createHouseBill } from "@/server/services/house.service";

const CHART_COLORS = ["#FF2A85", "#00E5FF", "#FFD84D", "#B7FF35", "#FFFFFF"];

interface DashboardDonutSlice {
  label: string;
  valueCents: number;
  color: string;
}

interface DashboardFlowStep {
  id: string;
  label: string;
  amountCents: number;
  dateLabel: string;
  runningTotalCents: number;
}

interface DashboardVisualization {
  safeToSpendCents: number;
  pendingCount: number;
  donutData: DashboardDonutSlice[];
  waterfallData: DashboardFlowStep[];
}

function getCurrentMonthRange() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return {
    month,
    year,
    start: new Date(year, now.getMonth(), 1),
    end: new Date(year, now.getMonth() + 1, 1)
  };
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error("Data invalida.");
  }

  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  }).format(date);
}

function sumCents(items: Array<{ valorCentavos: number }>) {
  return items.reduce((total, item) => total + item.valorCentavos, 0);
}

function buildDonutData(items: Array<{ categoria: string; valorCentavos: number }>) {
  const grouped = new Map<string, number>();

  items.forEach((item) => {
    grouped.set(item.categoria, (grouped.get(item.categoria) ?? 0) + item.valorCentavos);
  });

  return Array.from(grouped.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, valueCents], index) => ({
      label,
      valueCents,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
}

function buildWaterfallData(
  items: Array<{ id: string; label: string; amountCents: number; date: Date }>
) {
  const sorted = [...items].sort((a, b) => a.date.getTime() - b.date.getTime());
  let runningTotalCents = 0;

  return sorted
    .map((item) => {
    runningTotalCents += item.amountCents;

    return {
      id: item.id,
      label: item.label,
      amountCents: item.amountCents,
      dateLabel: formatDateLabel(item.date),
      runningTotalCents
    };
    })
    .slice(-6);
}

export async function createTransacao(data: {
  titulo: string;
  valorCentavos: number;
  categoria: string;
  escopo: EscopoTransacao;
  tipo: TipoTransacao;
  data: string;
}) {
  const user = await requireCurrentResident();

  if (!data.titulo.trim()) {
    throw new Error("Informe um titulo para o lancamento.");
  }

  if (data.valorCentavos <= 0) {
    throw new Error("Informe um valor valido.");
  }

  const referenceDate = parseDateInput(data.data);

  if (data.escopo === EscopoTransacao.CASA) {
    if (data.tipo !== TipoTransacao.DESPESA) {
      throw new Error("No contexto da casa, o lancamento rapido cria contas compartilhadas.");
    }

    await createHouseBill(user.id, {
      titulo: data.titulo,
      categoria: data.categoria,
      valorCentavos: data.valorCentavos,
      vencimento: referenceDate
    });
  } else if (data.tipo === TipoTransacao.RECEITA) {
    await createIncome(user.id, {
      titulo: data.titulo,
      valorCentavos: data.valorCentavos,
      recebidaEm: referenceDate
    });
  } else {
    await createExpense(user.id, {
      titulo: data.titulo,
      categoria: data.categoria,
      valorCentavos: data.valorCentavos,
      gastoEm: referenceDate
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/casa");
  revalidatePath("/pessoal");

  return { success: true };
}

export async function getDashboardVisualization(
  escopo: EscopoTransacao
): Promise<DashboardVisualization> {
  const user = await requireCurrentResident();
  const { month, year, start, end } = getCurrentMonthRange();

  if (escopo === EscopoTransacao.CASA) {
    const [bills, contributions] = await Promise.all([
      prisma.transacao.findMany({
        where: {
          casaId: user.casaId!,
          escopo: EscopoTransacao.CASA,
          tipo: TipoTransacao.DESPESA,
          dataVencimento: { gte: start, lt: end }
        },
        orderBy: { dataVencimento: "asc" },
        select: {
          id: true,
          titulo: true,
          categoria: true,
          valorCentavos: true,
          status: true,
          dataVencimento: true
        }
      }),
      prisma.contribuicao.findMany({
        where: {
          casaId: user.casaId!,
          mes: month,
          ano: year
        },
        orderBy: { criadaEm: "asc" },
        select: {
          id: true,
          valorCentavos: true,
          criadaEm: true,
          morador: {
            select: {
              nome: true
            }
          }
        }
      })
    ]);

    return {
      safeToSpendCents: sumCents(contributions) - sumCents(bills),
      pendingCount: bills.filter((item) => item.status === StatusTransacao.PENDENTE).length,
      donutData: buildDonutData(bills),
      waterfallData: buildWaterfallData([
        ...contributions.map((item) => ({
          id: `contribution-${item.id}`,
          label: `Contrib. ${item.morador.nome}`,
          amountCents: item.valorCentavos,
          date: item.criadaEm
        })),
        ...bills.map((item) => ({
          id: `bill-${item.id}`,
          label: item.titulo,
          amountCents: item.valorCentavos * -1,
          date: item.dataVencimento
        }))
      ])
    };
  }

  const [transactions, currentContribution] = await Promise.all([
    prisma.transacao.findMany({
      where: {
        moradorId: user.id,
        escopo: EscopoTransacao.PESSOAL,
        dataVencimento: { gte: start, lt: end }
      },
      orderBy: { dataVencimento: "asc" },
      select: {
        id: true,
        titulo: true,
        categoria: true,
        valorCentavos: true,
        status: true,
        tipo: true,
        dataVencimento: true
      }
    }),
    prisma.contribuicao.findFirst({
      where: {
        moradorId: user.id,
        casaId: user.casaId!,
        mes: month,
        ano: year
      },
      select: {
        id: true,
        valorCentavos: true,
        criadaEm: true
      }
    })
  ]);

  const incomes = transactions.filter((item) => item.tipo === TipoTransacao.RECEITA);
  const outgoing = transactions.filter((item) => item.tipo === TipoTransacao.DESPESA);
  const waterfallItems = [
    ...incomes.map((item) => ({
      id: `income-${item.id}`,
      label: item.titulo,
      amountCents: item.valorCentavos,
      date: item.dataVencimento
    })),
    ...outgoing.map((item) => ({
      id: `expense-${item.id}`,
      label: item.titulo,
      amountCents: item.valorCentavos * -1,
      date: item.dataVencimento
    }))
  ];

  if (currentContribution) {
    waterfallItems.push({
      id: `contribution-${currentContribution.id}`,
      label: "Contribuicao da casa",
      amountCents: currentContribution.valorCentavos * -1,
      date: currentContribution.criadaEm
    });
  }

  return {
    safeToSpendCents:
      sumCents(incomes) - sumCents(outgoing) - (currentContribution?.valorCentavos ?? 0),
    pendingCount: outgoing.filter((item) => item.status === StatusTransacao.PENDENTE).length,
    donutData: buildDonutData(outgoing),
    waterfallData: buildWaterfallData(waterfallItems)
  };
}
