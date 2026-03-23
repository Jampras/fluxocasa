import { ROUTES } from "@/config/routes";
import { toCurrencyValue } from "@/lib/utils";
import type { ActivityItem, DashboardSnapshot } from "@/types";
import { STATUS_PAID, ensureCurrentCycle, getMonthLabel, getMonthYear, getUserWithHouse, sumBy, toBillStatus } from "./_shared";

function formatActivityDate(date: Date, prefix: string) { return `${prefix} ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date)}`; }
function buildDashboardItemHref(tab: "casa" | "pessoal", focus: string) {
  return `/dashboard?tab=${tab}&focus=${focus}#${focus}`;
}

export const dashboardRepository = {
  async getDashboardSnapshot(userId: string): Promise<DashboardSnapshot> {
    const { month, year } = getMonthYear();
    const user = await getUserWithHouse(userId);
    if (!user) throw new Error("Usuario nao encontrado.");

    const cycle = user.casa ? await ensureCurrentCycle(user.casa.id, month, year) : null;
    
    const contasCasa = (user.casa?.transacoes ?? []).filter(t => t.escopo === "CASA" && t.tipo === "DESPESA").map(t => ({
      ...t, vencimento: t.dataVencimento, status: t.status === "CONCLUIDA" ? STATUS_PAID : "PENDENTE", pagaEm: t.status === "CONCLUIDA" ? t.dataPagamento : null
    }));
    
    const rendas = user.transacoes
      .filter(t => t.tipo === "RECEITA" && t.escopo === "PESSOAL")
      .map(t => ({ ...t, recebidaEm: t.dataPagamento, previstaEm: t.dataVencimento }));
    const contasPessoais = user.transacoes.filter(t => t.tipo === "DESPESA" && t.escopo === "PESSOAL" && t.status === "PENDENTE").map(t => ({...t, vencimento: t.dataVencimento, status: "PENDENTE"}));
    const gastos = user.transacoes.filter(t => t.tipo === "DESPESA" && t.escopo === "PESSOAL" && t.status === "CONCLUIDA").map(t => ({...t, gastoEm: t.dataVencimento, status: "PAGA"}));

    const houseBillsThisMonth = contasCasa.filter((bill) => bill.vencimento.getMonth() + 1 === month && bill.vencimento.getFullYear() === year);
    const incomesThisMonth = rendas.filter((item) => item.previstaEm.getMonth() + 1 === month && item.previstaEm.getFullYear() === year);
    const receivedIncomesThisMonth = incomesThisMonth.filter((item) => item.status === "CONCLUIDA");
    const personalBillsThisMonth = contasPessoais.filter((item) => item.vencimento.getMonth() + 1 === month && item.vencimento.getFullYear() === year);
    const expensesThisMonth = gastos.filter((item) => item.gastoEm.getMonth() + 1 === month && item.gastoEm.getFullYear() === year);
    const currentContribution = user.contribuicoes.find((item) => item.mes === month && item.ano === year);
    const goalsThisMonth = user.metas.filter((item) => item.mes === month && item.ano === year);

    const privateWalletCents = sumBy(receivedIncomesThisMonth, (item) => item.valorCentavos) - sumBy(personalBillsThisMonth, (item) => item.valorCentavos) - sumBy(expensesThisMonth, (item) => item.valorCentavos) - (currentContribution?.valorCentavos ?? 0);
    const goalsHit = goalsThisMonth.filter((goal) => {
      const spent = sumBy(expensesThisMonth.filter((item) => item.categoria === goal.categoria), (item) => item.valorCentavos);
      return spent <= goal.valorMetaCentavos;
    }).length;

    const insight = (() => {
      const nextPendingHouseBill = houseBillsThisMonth.filter((item) => item.status !== STATUS_PAID).sort((a, b) => a.vencimento.getTime() - b.vencimento.getTime())[0];
      if (nextPendingHouseBill) {
        return {
          title: houseBillsThisMonth.filter((item) => item.status !== STATUS_PAID).length > 1 ? "Existem contas da casa pedindo atencao" : "Existe uma conta da casa pedindo atencao",
          description: `A proxima vence em ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(nextPendingHouseBill.vencimento)}. Priorize essa revisao para evitar atraso.`, actionLabel: "Abrir contas da casa", actionHref: buildDashboardItemHref("casa", `house-bill-${nextPendingHouseBill.id}`)
        };
      }
      if (privateWalletCents < 0) { return { title: "Sua carteira pessoal fechou no vermelho", description: "Revise gastos e contas pessoais para recuperar margem ainda neste mes.", actionLabel: "Abrir painel pessoal", actionHref: "/dashboard?tab=pessoal#personal-manage-bills" }; }
      if (goalsThisMonth.length === 0) { return { title: "Voce ainda nao definiu metas para este mes", description: "Cadastre limites por categoria para acompanhar seus gastos variaveis.", actionLabel: "Criar metas", actionHref: "/dashboard?tab=pessoal#personal-create-goal" }; }
      if ((cycle?.endingBalance ?? 0) > 0) { return { title: "A casa terminou o mes com folga", description: `O caixa projetado esta em ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cycle?.endingBalance ?? 0)}. Considere reservar parte do saldo.`, actionLabel: "Ver resumo da casa", actionHref: "/dashboard?tab=casa" }; }
      return { title: "Panorama do mes atualizado", description: "Continue registrando contas e contribuicoes para manter o fechamento confiavel.", actionLabel: "Acompanhar dashboard", actionHref: ROUTES.dashboard };
    })();

    return {
      monthLabel: getMonthLabel(), houseCash: cycle?.endingBalance ?? 0, pendingBills: houseBillsThisMonth.filter((item) => item.status !== STATUS_PAID).length, privateWallet: toCurrencyValue(privateWalletCents), goalsHit: `${goalsHit}/${goalsThisMonth.length || 0}`, activity: await this.getRecentActivity(userId), insight
    };
  },
  async getRecentActivity(userId: string): Promise<ActivityItem[]> {
    const user = await getUserWithHouse(userId);
    if (!user) throw new Error("Usuario nao encontrado.");

    const rendas = user.transacoes
      .filter(t => t.tipo === "RECEITA" && t.escopo === "PESSOAL")
      .map(t => ({ ...t, recebidaEm: t.dataPagamento, previstaEm: t.dataVencimento }));

    const contasCasa = (user.casa?.transacoes ?? []).filter(t => t.escopo === "CASA" && t.tipo === "DESPESA").map(t => ({
      ...t, vencimento: t.dataVencimento, status: t.status === "CONCLUIDA" ? STATUS_PAID : "PENDENTE", pagaEm: t.status === "CONCLUIDA" ? t.dataPagamento : null
    }));

    const contasPessoais = user.transacoes.filter(t => t.tipo === "DESPESA" && t.escopo === "PESSOAL").map(t => ({
      ...t, vencimento: t.dataVencimento, status: t.status === "CONCLUIDA" ? STATUS_PAID : "PENDENTE"
    }));

    const items = [
      ...rendas.map((income) => {
        const isReceived = income.status === "CONCLUIDA";
        const tone: ActivityItem["badge"]["tone"] = isReceived ? "success" : "slate";
        return {
          id: `income-${income.id}`, title: income.titulo, subtitle: `Renda - ${income.categoria === "SALARIO" ? "Salario" : "Extra"}`, amount: toCurrencyValue(income.valorCentavos), dateLabel: formatActivityDate(isReceived && income.recebidaEm ? income.recebidaEm : income.previstaEm, isReceived ? "Recebido em" : "Previsto em"), badge: { label: isReceived ? "Recebido" : "Previsto", tone }, detailsHref: buildDashboardItemHref("pessoal", `income-${income.id}`), detailsLabel: "Editar", canMarkIncomeAsReceived: !isReceived, incomeId: income.id, sortDate: (income.recebidaEm ?? income.previstaEm).getTime()
        };
      }),
      ...contasPessoais.map((bill) => {
        const uiStatus = toBillStatus(bill.status, bill.vencimento);
        const tone: ActivityItem["badge"]["tone"] =
          uiStatus === "paid" ? "success" : uiStatus === "warning" ? "amber" : "danger";
        return {
          id: `personal-${bill.id}`, title: bill.titulo, subtitle: bill.categoria, amount: toCurrencyValue(bill.valorCentavos), dateLabel: formatActivityDate(bill.vencimento, uiStatus === "paid" ? "Pago ate" : "Vence em"), badge: { label: uiStatus === "paid" ? "Paga" : uiStatus === "warning" ? "Urgente" : "Pendente", tone }, detailsHref: buildDashboardItemHref("pessoal", `personal-bill-${bill.id}`), detailsLabel: "Editar", canMarkPersonalAsPaid: uiStatus !== "paid", personalBillId: bill.id, sortDate: bill.vencimento.getTime()
        };
      }),
      ...contasCasa.map((bill) => {
        const uiStatus = toBillStatus(bill.status, bill.vencimento);
        const tone: ActivityItem["badge"]["tone"] =
          uiStatus === "paid" ? "success" : uiStatus === "warning" ? "amber" : "danger";
        return {
          id: `house-${bill.id}`, title: bill.titulo, subtitle: `Casa - ${bill.categoria}`, amount: toCurrencyValue(bill.valorCentavos), dateLabel: uiStatus === "paid" && bill.pagaEm ? formatActivityDate(bill.pagaEm, "Paga em") : formatActivityDate(bill.vencimento, "Vence em"), badge: { label: uiStatus === "paid" ? "Paga" : uiStatus === "warning" ? "Urgente" : "Pendente", tone }, detailsHref: buildDashboardItemHref("casa", `house-bill-${bill.id}`), detailsLabel: "Editar", canMarkAsPaid: uiStatus !== "paid", houseBillId: bill.id, sortDate: bill.pagaEm?.getTime() ?? bill.vencimento.getTime()
        };
      })
    ].sort((a, b) => b.sortDate - a.sortDate).slice(0, 3);
    return items.map(({ sortDate, ...item }) => item);
  }
};
