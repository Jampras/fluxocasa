import { EscopoTransacao, StatusTransacao, TipoTransacao } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ROUTES } from "@/config/routes";
import { toCurrencyValue } from "@/lib/utils";
import { UserFacingError } from "@/server/http/errors";
import type { ActivityItem, DashboardSnapshot } from "@/types";
import {
  ensureCurrentCycle,
  getMonthLabel,
  getMonthRange,
  getMonthYear,
  sumBy,
  toBillStatus
} from "./_shared";

function formatActivityDate(date: Date, prefix: string) {
  return `${prefix} ${new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  }).format(date)}`;
}

function buildDashboardItemHref(tab: "casa" | "pessoal", focus: string) {
  return `/gerenciar?tab=${tab}&focus=${focus}#${focus}`;
}

async function getDashboardData(userId: string) {
  const { month, year } = getMonthYear();
  const { start, end } = getMonthRange(month, year);
  const resident = await prisma.morador.findUnique({
    where: { id: userId },
    select: { casaId: true }
  });

  if (!resident) {
    throw new UserFacingError("Usuario nao encontrado.", 404);
  }

  const [cycle, houseBills, personalTransactions, currentContribution, goals] = await Promise.all([
    resident.casaId ? ensureCurrentCycle(resident.casaId, month, year) : Promise.resolve(null),
    resident.casaId
      ? prisma.transacao.findMany({
          where: {
            casaId: resident.casaId,
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
            dataVencimento: true,
            dataPagamento: true
          }
        })
      : Promise.resolve([]),
    prisma.transacao.findMany({
      where: {
        moradorId: userId,
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
        dataVencimento: true,
        dataPagamento: true
      }
    }),
    resident.casaId
      ? prisma.contribuicao.findFirst({
          where: {
            moradorId: userId,
            casaId: resident.casaId,
            mes: month,
            ano: year
          },
          select: {
            id: true,
            valorCentavos: true,
            criadaEm: true
          }
        })
      : Promise.resolve(null),
    prisma.metaOrcamento.findMany({
      where: {
        moradorId: userId,
        mes: month,
        ano: year
      },
      orderBy: { categoria: "asc" }
    })
  ]);

  return {
    cycle,
    houseBills,
    personalTransactions,
    currentContribution,
    goals
  };
}

function buildRecentActivityFromData({
  houseBills,
  personalTransactions
}: {
  houseBills: Array<{
    id: string;
    titulo: string;
    categoria: string;
    valorCentavos: number;
    status: StatusTransacao;
    dataVencimento: Date;
    dataPagamento: Date | null;
  }>;
  personalTransactions: Array<{
    id: string;
    titulo: string;
    categoria: string;
    valorCentavos: number;
    status: StatusTransacao;
    tipo: TipoTransacao;
    dataVencimento: Date;
    dataPagamento: Date | null;
  }>;
}): ActivityItem[] {
  const incomes = personalTransactions.filter((item) => item.tipo === TipoTransacao.RECEITA);
  const personalBills = personalTransactions.filter(
    (item) => item.tipo === TipoTransacao.DESPESA && item.status === StatusTransacao.PENDENTE
  );

  const items = [
    ...incomes.map((income) => {
      const isReceived = income.status === StatusTransacao.CONCLUIDA;
      const tone: ActivityItem["badge"]["tone"] = isReceived ? "success" : "slate";

      return {
        id: `income-${income.id}`,
        title: income.titulo,
        subtitle: `Renda - ${income.categoria === "SALARIO" ? "Salario" : "Extra"}`,
        amount: toCurrencyValue(income.valorCentavos),
        dateLabel: formatActivityDate(
          isReceived && income.dataPagamento ? income.dataPagamento : income.dataVencimento,
          isReceived ? "Recebido em" : "Previsto em"
        ),
        badge: { label: isReceived ? "Recebido" : "Previsto", tone },
        detailsHref: buildDashboardItemHref("pessoal", `income-${income.id}`),
        detailsLabel: "Editar",
        canMarkIncomeAsReceived: !isReceived,
        incomeId: income.id,
        sortDate: (income.dataPagamento ?? income.dataVencimento).getTime()
      };
    }),
    ...personalBills.map((bill) => {
      const uiStatus = toBillStatus(bill.status, bill.dataVencimento);
      const tone: ActivityItem["badge"]["tone"] =
        uiStatus === "paid" ? "success" : uiStatus === "warning" ? "amber" : "danger";

      return {
        id: `personal-${bill.id}`,
        title: bill.titulo,
        subtitle: bill.categoria,
        amount: toCurrencyValue(bill.valorCentavos),
        dateLabel: formatActivityDate(
          bill.dataVencimento,
          uiStatus === "paid" ? "Pago ate" : "Vence em"
        ),
        badge: {
          label: uiStatus === "paid" ? "Paga" : uiStatus === "warning" ? "Urgente" : "Pendente",
          tone
        },
        detailsHref: buildDashboardItemHref("pessoal", `personal-bill-${bill.id}`),
        detailsLabel: "Editar",
        canMarkPersonalAsPaid: uiStatus !== "paid",
        personalBillId: bill.id,
        sortDate: bill.dataVencimento.getTime()
      };
    }),
    ...houseBills.map((bill) => {
      const uiStatus = toBillStatus(bill.status, bill.dataVencimento);
      const tone: ActivityItem["badge"]["tone"] =
        uiStatus === "paid" ? "success" : uiStatus === "warning" ? "amber" : "danger";

      return {
        id: `house-${bill.id}`,
        title: bill.titulo,
        subtitle: `Casa - ${bill.categoria}`,
        amount: toCurrencyValue(bill.valorCentavos),
        dateLabel:
          uiStatus === "paid" && bill.dataPagamento
            ? formatActivityDate(bill.dataPagamento, "Paga em")
            : formatActivityDate(bill.dataVencimento, "Vence em"),
        badge: {
          label: uiStatus === "paid" ? "Paga" : uiStatus === "warning" ? "Urgente" : "Pendente",
          tone
        },
        detailsHref: buildDashboardItemHref("casa", `house-bill-${bill.id}`),
        detailsLabel: "Editar",
        canMarkAsPaid: uiStatus !== "paid",
        houseBillId: bill.id,
        sortDate: bill.dataPagamento?.getTime() ?? bill.dataVencimento.getTime()
      };
    })
  ]
    .sort((a, b) => b.sortDate - a.sortDate)
    .slice(0, 3);

  return items.map(({ sortDate, ...item }) => item);
}

export const dashboardRepository = {
  async getDashboardSnapshot(userId: string): Promise<DashboardSnapshot> {
    const { houseBills, personalTransactions, currentContribution, goals, cycle } =
      await getDashboardData(userId);

    const incomes = personalTransactions.filter((item) => item.tipo === TipoTransacao.RECEITA);
    const receivedIncomesThisMonth = incomes.filter((item) => item.status === StatusTransacao.CONCLUIDA);
    const personalBillsThisMonth = personalTransactions.filter(
      (item) => item.tipo === TipoTransacao.DESPESA && item.status === StatusTransacao.PENDENTE
    );
    const expensesThisMonth = personalTransactions.filter(
      (item) => item.tipo === TipoTransacao.DESPESA && item.status === StatusTransacao.CONCLUIDA
    );

    const privateWalletCents =
      sumBy(receivedIncomesThisMonth, (item) => item.valorCentavos) -
      sumBy(personalBillsThisMonth, (item) => item.valorCentavos) -
      sumBy(expensesThisMonth, (item) => item.valorCentavos) -
      (currentContribution?.valorCentavos ?? 0);

    const goalsHit = goals.filter((goal) => {
      const spent = sumBy(
        expensesThisMonth.filter((item) => item.categoria === goal.categoria),
        (item) => item.valorCentavos
      );
      return spent <= goal.valorMetaCentavos;
    }).length;

    const nextPendingHouseBill = houseBills
      .filter((item) => item.status !== StatusTransacao.CONCLUIDA)
      .sort((a, b) => a.dataVencimento.getTime() - b.dataVencimento.getTime())[0];

    const insight = (() => {
      if (nextPendingHouseBill) {
        return {
          title:
            houseBills.filter((item) => item.status !== StatusTransacao.CONCLUIDA).length > 1
              ? "Existem contas da casa pedindo atencao"
              : "Existe uma conta da casa pedindo atencao",
          description: `A proxima vence em ${new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit"
          }).format(nextPendingHouseBill.dataVencimento)}. Priorize essa revisao para evitar atraso.`,
          actionLabel: "Abrir contas da casa",
          actionHref: buildDashboardItemHref("casa", `house-bill-${nextPendingHouseBill.id}`)
        };
      }

      if (privateWalletCents < 0) {
        return {
          title: "Sua carteira pessoal fechou no vermelho",
          description: "Revise gastos e contas pessoais para recuperar margem ainda neste mes.",
          actionLabel: "Abrir gerenciar pessoal",
          actionHref: "/gerenciar?tab=pessoal#personal-manage-bills"
        };
      }

      if (goals.length === 0) {
        return {
          title: "Voce ainda nao definiu metas para este mes",
          description: "Cadastre limites por categoria para acompanhar seus gastos variaveis.",
          actionLabel: "Criar metas",
          actionHref: "/gerenciar?tab=pessoal#personal-create-goal"
        };
      }

      if ((cycle?.endingBalance ?? 0) > 0) {
        return {
          title: "A casa terminou o mes com folga",
          description: `O caixa projetado esta em ${new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
          }).format(cycle?.endingBalance ?? 0)}. Considere reservar parte do saldo.`,
          actionLabel: "Ver gerenciar casa",
          actionHref: "/gerenciar?tab=casa"
        };
      }

      return {
        title: "Panorama do mes atualizado",
        description: "Continue registrando contas e contribuicoes para manter o fechamento confiavel.",
        actionLabel: "Acompanhar painel",
        actionHref: ROUTES.dashboard
      };
    })();

    return {
      monthLabel: getMonthLabel(),
      houseCash: cycle?.endingBalance ?? 0,
      pendingBills: houseBills.filter((item) => item.status !== StatusTransacao.CONCLUIDA).length,
      privateWallet: toCurrencyValue(privateWalletCents),
      goalsHit: `${goalsHit}/${goals.length || 0}`,
      activity: buildRecentActivityFromData({ houseBills, personalTransactions }),
      insight
    };
  },

  async getRecentActivity(userId: string): Promise<ActivityItem[]> {
    const { houseBills, personalTransactions } = await getDashboardData(userId);
    return buildRecentActivityFromData({ houseBills, personalTransactions });
  }
};
