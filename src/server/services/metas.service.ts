import { EscopoTransacao, StatusTransacao, TipoTransacao } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ensureHouseRecurringTransactions, ensurePersonalRecurringTransactions } from "@/server/repositories/_recurrence";
import { getMonthLabel, getMonthRange, getMonthYear, toBillStatus } from "@/server/repositories/_shared";

interface GoalsOverviewSummary {
  monthLabel: string;
  totalGoals: number;
  goalsWithinLimit: number;
  urgentPersonalBills: number;
  urgentHouseBills: number;
}

export async function getGoalsOverviewSummary(userId: string): Promise<GoalsOverviewSummary> {
  const { month, year } = getMonthYear();
  const { start, end } = getMonthRange(month, year);
  const resident = await prisma.morador.findUnique({
    where: { id: userId },
    select: { casaId: true }
  });

  if (!resident) {
    throw new Error("Usuario nao encontrado.");
  }

  await Promise.all([
    ensurePersonalRecurringTransactions(userId),
    resident.casaId ? ensureHouseRecurringTransactions(resident.casaId) : Promise.resolve()
  ]);

  const [goals, expenseTotals, personalBills, houseBills] = await Promise.all([
    prisma.metaOrcamento.findMany({
      where: { moradorId: userId, mes: month, ano: year },
      select: { categoria: true, valorMetaCentavos: true }
    }),
    prisma.transacao.groupBy({
      by: ["categoria"],
      where: {
        moradorId: userId,
        escopo: EscopoTransacao.PESSOAL,
        tipo: TipoTransacao.DESPESA,
        status: StatusTransacao.CONCLUIDA,
        dataVencimento: { gte: start, lt: end }
      },
      _sum: { valorCentavos: true }
    }),
    prisma.transacao.findMany({
      where: {
        moradorId: userId,
        escopo: EscopoTransacao.PESSOAL,
        tipo: TipoTransacao.DESPESA,
        status: StatusTransacao.PENDENTE,
        dataVencimento: { gte: start, lt: end }
      },
      select: {
        status: true,
        dataVencimento: true
      }
    }),
    resident.casaId
      ? prisma.transacao.findMany({
          where: {
            casaId: resident.casaId,
            escopo: EscopoTransacao.CASA,
            tipo: TipoTransacao.DESPESA,
            status: StatusTransacao.PENDENTE,
            dataVencimento: { gte: start, lt: end }
          },
          select: {
            status: true,
            dataVencimento: true
          }
        })
      : Promise.resolve([])
  ]);

  const spentByCategory = new Map(
    expenseTotals.map((item) => [item.categoria, item._sum.valorCentavos ?? 0])
  );

  return {
    monthLabel: getMonthLabel(),
    totalGoals: goals.length,
    goalsWithinLimit: goals.filter(
      (goal) => (spentByCategory.get(goal.categoria) ?? 0) <= goal.valorMetaCentavos
    ).length,
    urgentPersonalBills: personalBills.filter(
      (bill) => toBillStatus(bill.status, bill.dataVencimento) === "warning"
    ).length,
    urgentHouseBills: houseBills.filter(
      (bill) => toBillStatus(bill.status, bill.dataVencimento) === "warning"
    ).length
  };
}
