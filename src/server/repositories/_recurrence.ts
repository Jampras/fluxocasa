import { EscopoTransacao, FrequenciaTransacao, StatusTransacao, TipoTransacao } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { safeCache } from "@/lib/safe-cache";

function addMonth(date: Date) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}

function monthKey(date: Date) {
  return date.getFullYear() * 12 + date.getMonth();
}

function isSyncStateCurrent(
  state: { syncedMonth: number; syncedYear: number } | null,
  month: number,
  year: number
) {
  if (!state) {
    return false;
  }

  return state.syncedYear > year || (state.syncedYear === year && state.syncedMonth >= month);
}

function isRecurring(frequency: FrequenciaTransacao) {
  return frequency === FrequenciaTransacao.MENSAL ||
    frequency === FrequenciaTransacao.PARCELADA ||
    frequency === FrequenciaTransacao.FIXA;
}

function canCreateNextOccurrence(transaction: {
  frequencia: FrequenciaTransacao;
  parcelaAtual: number | null;
  parcelasTotais: number | null;
}) {
  if (transaction.frequencia !== FrequenciaTransacao.PARCELADA) {
    return true;
  }

  return (transaction.parcelaAtual ?? 1) < (transaction.parcelasTotais ?? 1);
}

function buildCreatePayload(transaction: {
  serieId: string | null;
  titulo: string;
  valorCentavos: number;
  categoria: string;
  dataVencimento: Date;
  observacao: string | null;
  escopo: EscopoTransacao;
  tipo: TipoTransacao;
  frequencia: FrequenciaTransacao;
  parcelaAtual: number | null;
  parcelasTotais: number | null;
  moradorId: string;
  casaId: string | null;
}) {
  const nextDueDate = addMonth(transaction.dataVencimento);
  const nextInstallment =
    transaction.frequencia === FrequenciaTransacao.PARCELADA
      ? (transaction.parcelaAtual ?? 1) + 1
      : transaction.parcelaAtual;

  return {
    serieId: transaction.serieId,
    titulo: transaction.titulo,
    valorCentavos: transaction.valorCentavos,
    categoria: transaction.categoria,
    dataVencimento: nextDueDate,
    observacao: transaction.observacao,
    escopo: transaction.escopo,
    tipo: transaction.tipo,
    frequencia: transaction.frequencia,
    status: StatusTransacao.PENDENTE,
    dataPagamento: null,
    parcelaAtual: nextInstallment,
    parcelasTotais: transaction.parcelasTotais,
    moradorId: transaction.moradorId,
    casaId: transaction.casaId
  };
}

async function ensureRecurringTransactions(where: {
  moradorId?: string;
  casaId?: string;
  escopo: EscopoTransacao;
  ownerId: string;
}) {
  const { ownerId, ...queryWhere } = where;
  const referenceDate = new Date();
  const referenceMonth = referenceDate.getMonth() + 1;
  const referenceYear = referenceDate.getFullYear();
  const state = await prisma.recurringSyncState.findUnique({
    where: {
      scope_ownerId: {
        scope: where.escopo,
        ownerId
      }
    },
    select: {
      syncedMonth: true,
      syncedYear: true
    }
  });

  if (isSyncStateCurrent(state, referenceMonth, referenceYear)) {
    return;
  }

  const monthEnd = new Date(referenceYear, referenceDate.getMonth() + 1, 1);
  const recurringTransactions = await prisma.transacao.findMany({
    where: {
      ...queryWhere,
      frequencia: {
        in: [
          FrequenciaTransacao.MENSAL,
          FrequenciaTransacao.PARCELADA,
          FrequenciaTransacao.FIXA
        ]
      },
      dataVencimento: {
        lt: monthEnd
      }
    },
    orderBy: [{ dataVencimento: "asc" }, { criadaEm: "asc" }]
  });

  const series = new Map<string, typeof recurringTransactions>();

  recurringTransactions.forEach((transaction) => {
    const key = transaction.serieId ?? transaction.id;
    const current = series.get(key) ?? [];
    current.push(transaction);
    series.set(key, current);
  });

  for (const transactions of series.values()) {
    let latest = transactions[transactions.length - 1];

    while (
      monthKey(latest.dataVencimento) < monthKey(referenceDate) &&
      isRecurring(latest.frequencia) &&
      canCreateNextOccurrence(latest)
    ) {
      const nextDueDate = addMonth(latest.dataVencimento);
      const existing = transactions.find((transaction) => monthKey(transaction.dataVencimento) === monthKey(nextDueDate));

      if (existing) {
        latest = existing;
        continue;
      }

      const created = await prisma.transacao.create({
        data: buildCreatePayload(latest)
      });

      transactions.push(created);
      latest = created;
    }
  }

  await prisma.recurringSyncState.upsert({
    where: {
      scope_ownerId: {
        scope: where.escopo,
        ownerId
      }
    },
    update: {
      syncedMonth: referenceMonth,
      syncedYear: referenceYear
    },
    create: {
      scope: where.escopo,
      ownerId,
      syncedMonth: referenceMonth,
      syncedYear: referenceYear
    }
  });
}

export const ensurePersonalRecurringTransactions = safeCache(async function ensurePersonalRecurringTransactions(userId: string) {
  await ensureRecurringTransactions({
    ownerId: userId,
    moradorId: userId,
    escopo: EscopoTransacao.PESSOAL
  });
});

export const ensureHouseRecurringTransactions = safeCache(async function ensureHouseRecurringTransactions(casaId: string) {
  await ensureRecurringTransactions({
    ownerId: casaId,
    casaId,
    escopo: EscopoTransacao.CASA
  });
});

export async function invalidateRecurringSyncState(scope: EscopoTransacao, ownerId: string) {
  await prisma.recurringSyncState.deleteMany({
    where: {
      scope,
      ownerId
    }
  });
}
