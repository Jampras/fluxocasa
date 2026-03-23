import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { toCurrencyValue } from "@/lib/utils";
import type { PersonalSnapshot, IncomeRecord, PersonalBillRecord, ExpenseRecord } from "@/types";
import type { CreateIncomeInput, UpdateIncomeInput, CreatePersonalBillInput, UpdatePersonalBillInput, CreateExpenseInput, UpdateExpenseInput, UpsertBudgetGoalInput, UpdateBudgetGoalInput } from "./_types";
import { dateInputValue, formatDueLabel, frequencyToUi, getMonthLabel, getMonthYear, getUserWithHouse, mapHouseBill, sumBy, toBillStatus } from "./_shared";
import { ensurePersonalRecurringTransactions } from "./_recurrence";
import { EscopoTransacao, FrequenciaTransacao, TipoTransacao, StatusTransacao } from "@prisma/client";

function buildRecurringData(
  frequency: CreateIncomeInput["frequencia"] | CreatePersonalBillInput["frequencia"],
  installmentTotal?: number
) {
  return {
    frequencia: frequency as FrequenciaTransacao,
    serieId: frequency === "UNICA" ? null : randomUUID(),
    parcelaAtual: frequency === "PARCELADA" ? 1 : null,
    parcelasTotais: frequency === "PARCELADA" ? installmentTotal ?? null : null
  };
}

export const personalRepository = {
  async createIncome(userId: string, input: CreateIncomeInput) {
    const recurrence = buildRecurringData(input.frequencia, input.parcelasTotais);

    await prisma.transacao.create({
      data: {
        moradorId: userId,
        titulo: input.titulo,
        valorCentavos: input.valorCentavos,
        categoria: "SALARIO",
        dataVencimento: input.recebidaEm,
        dataPagamento: input.recebidaEm,
        escopo: EscopoTransacao.PESSOAL,
        tipo: TipoTransacao.RECEITA,
        frequencia: recurrence.frequencia,
        serieId: recurrence.serieId,
        parcelaAtual: recurrence.parcelaAtual,
        parcelasTotais: recurrence.parcelasTotais,
        status: StatusTransacao.CONCLUIDA
      }
    });
  },
  async updateIncome(userId: string, incomeId: string, input: UpdateIncomeInput) {
    const income = await prisma.transacao.findUnique({ where: { id: incomeId } });
    if (!income || income.moradorId !== userId) throw new Error("Renda nao encontrada.");
    const frequency = input.frequencia as FrequenciaTransacao;
    await prisma.transacao.update({
      where: { id: incomeId },
      data: {
        titulo: input.titulo,
        valorCentavos: input.valorCentavos,
        dataVencimento: input.recebidaEm,
        dataPagamento: input.recebidaEm,
        frequencia: frequency,
        serieId: frequency === FrequenciaTransacao.UNICA ? null : income.serieId ?? randomUUID(),
        parcelaAtual: frequency === FrequenciaTransacao.PARCELADA ? income.parcelaAtual ?? 1 : null,
        parcelasTotais: frequency === FrequenciaTransacao.PARCELADA ? input.parcelasTotais ?? income.parcelasTotais ?? 1 : null
      }
    });
  },
  async deleteIncome(userId: string, incomeId: string) {
    const t = await prisma.transacao.findUnique({ where: { id: incomeId } });
    if (!t || t.moradorId !== userId) throw new Error("Renda nao encontrada.");
    await prisma.transacao.delete({ where: { id: incomeId } });
  },
  async createPersonalBill(userId: string, input: CreatePersonalBillInput) {
    const recurrence = buildRecurringData(input.frequencia, input.parcelasTotais);

    await prisma.transacao.create({
      data: {
        moradorId: userId,
        titulo: input.titulo,
        categoria: input.categoria,
        valorCentavos: input.valorCentavos,
        dataVencimento: input.vencimento,
        observacao: input.observacao,
        escopo: EscopoTransacao.PESSOAL,
        tipo: TipoTransacao.DESPESA,
        frequencia: recurrence.frequencia,
        serieId: recurrence.serieId,
        parcelaAtual: recurrence.parcelaAtual,
        parcelasTotais: recurrence.parcelasTotais,
        status: StatusTransacao.PENDENTE
      }
    });
  },
  async updatePersonalBill(userId: string, billId: string, input: UpdatePersonalBillInput) {
    const bill = await prisma.transacao.findUnique({ where: { id: billId } });
    if (!bill || bill.moradorId !== userId) throw new Error("Conta pessoal nao encontrada.");
    const nextStatus = input.status === "PAGA" ? StatusTransacao.CONCLUIDA : StatusTransacao.PENDENTE;
    const frequency = input.frequencia as FrequenciaTransacao;
    await prisma.transacao.update({
      where: { id: billId },
      data: {
        titulo: input.titulo,
        categoria: input.categoria,
        valorCentavos: input.valorCentavos,
        dataVencimento: input.vencimento,
        observacao: input.observacao,
        frequencia: frequency,
        serieId: frequency === FrequenciaTransacao.UNICA ? null : bill.serieId ?? randomUUID(),
        parcelaAtual: frequency === FrequenciaTransacao.PARCELADA ? bill.parcelaAtual ?? 1 : null,
        parcelasTotais: frequency === FrequenciaTransacao.PARCELADA ? input.parcelasTotais ?? bill.parcelasTotais ?? 1 : null,
        status: nextStatus,
        dataPagamento: nextStatus === StatusTransacao.CONCLUIDA ? bill.dataPagamento ?? new Date() : null
      }
    });
  },
  async markPersonalBillAsPaid(userId: string, billId: string) {
    const bill = await prisma.transacao.findUnique({ where: { id: billId } });
    if (!bill || bill.moradorId !== userId) throw new Error("Conta pessoal nao encontrada.");
    await prisma.transacao.update({
      where: { id: billId },
      data: { status: StatusTransacao.CONCLUIDA, dataPagamento: bill.dataPagamento ?? new Date() }
    });
  },
  async deletePersonalBill(userId: string, billId: string) {
    const bill = await prisma.transacao.findUnique({ where: { id: billId } });
    if (!bill || bill.moradorId !== userId) throw new Error("Conta pessoal nao encontrada.");
    await prisma.transacao.delete({ where: { id: billId } });
  },
  async createExpense(userId: string, input: CreateExpenseInput) {
    await prisma.transacao.create({
      data: { moradorId: userId, titulo: input.titulo, categoria: input.categoria, valorCentavos: input.valorCentavos, dataVencimento: input.gastoEm, escopo: EscopoTransacao.PESSOAL, tipo: TipoTransacao.DESPESA, frequencia: "UNICA", status: StatusTransacao.CONCLUIDA }
    });
  },
  async updateExpense(userId: string, expenseId: string, input: UpdateExpenseInput) {
    const expense = await prisma.transacao.findUnique({ where: { id: expenseId } });
    if (!expense || expense.moradorId !== userId) throw new Error("Gasto nao encontrado.");
    await prisma.transacao.update({
      where: { id: expenseId },
      data: { titulo: input.titulo, categoria: input.categoria, valorCentavos: input.valorCentavos, dataVencimento: input.gastoEm }
    });
  },
  async deleteExpense(userId: string, expenseId: string) {
    const expense = await prisma.transacao.findUnique({ where: { id: expenseId } });
    if (!expense || expense.moradorId !== userId) throw new Error("Gasto nao encontrado.");
    await prisma.transacao.delete({ where: { id: expenseId } });
  },
  async upsertBudgetGoal(userId: string, input: UpsertBudgetGoalInput) {
    await prisma.metaOrcamento.upsert({
      where: { moradorId_categoria_mes_ano: { moradorId: userId, categoria: input.categoria, mes: input.mes, ano: input.ano } },
      update: { valorMetaCentavos: input.valorMetaCentavos },
      create: { moradorId: userId, categoria: input.categoria, valorMetaCentavos: input.valorMetaCentavos, mes: input.mes, ano: input.ano }
    });
  },
  async updateBudgetGoal(userId: string, goalId: string, input: UpdateBudgetGoalInput) {
    const goal = await prisma.metaOrcamento.findUnique({ where: { id: goalId } });
    if (!goal || goal.moradorId !== userId) throw new Error("Meta nao encontrada.");
    await prisma.metaOrcamento.update({ where: { id: goalId }, data: { categoria: input.categoria, valorMetaCentavos: input.valorMetaCentavos } });
  },
  async deleteBudgetGoal(userId: string, goalId: string) {
    const goal = await prisma.metaOrcamento.findUnique({ where: { id: goalId } });
    if (!goal || goal.moradorId !== userId) throw new Error("Meta nao encontrada.");
    await prisma.metaOrcamento.delete({ where: { id: goalId } });
  },

  async getPersonalSnapshot(userId: string): Promise<PersonalSnapshot> {
    const { month, year } = getMonthYear();
    await ensurePersonalRecurringTransactions(userId);
    const user = await getUserWithHouse(userId);

    if (!user) throw new Error("Usuario nao encontrado.");

    const rendas = user.transacoes.filter(t => t.tipo === "RECEITA" && t.escopo === "PESSOAL").map(t => ({...t, recebidaEm: t.dataVencimento}));
    const contasPessoais = user.transacoes.filter(t => t.tipo === "DESPESA" && t.escopo === "PESSOAL" && t.status === "PENDENTE").map(t => ({...t, vencimento: t.dataVencimento}));
    const gastos = user.transacoes.filter(t => t.tipo === "DESPESA" && t.escopo === "PESSOAL" && t.status === "CONCLUIDA").map(t => ({...t, gastoEm: t.dataVencimento}));

    const incomes = rendas.filter((item) => item.recebidaEm.getMonth() + 1 === month && item.recebidaEm.getFullYear() === year).sort((a, b) => b.recebidaEm.getTime() - a.recebidaEm.getTime());
    const personalBills = contasPessoais.filter((item) => item.vencimento.getMonth() + 1 === month && item.vencimento.getFullYear() === year).sort((a, b) => a.vencimento.getTime() - b.vencimento.getTime());
    const currentContribution = user.contribuicoes.find((item) => item.mes === month && item.ano === year);
    const expenses = gastos.filter((item) => item.gastoEm.getMonth() + 1 === month && item.gastoEm.getFullYear() === year).sort((a, b) => b.gastoEm.getTime() - a.gastoEm.getTime());
    const goals = user.metas.filter((item) => item.mes === month && item.ano === year);
    const weeklyBills = [...personalBills]
      .sort((a, b) => {
        const statusWeight = toBillStatus(a.status, a.vencimento) === "warning" ? -1 : 0;
        const nextStatusWeight = toBillStatus(b.status, b.vencimento) === "warning" ? -1 : 0;
        return statusWeight - nextStatusWeight || a.vencimento.getTime() - b.vencimento.getTime();
      })
      .slice(0, 4)
      .map((item) =>
        mapHouseBill(
          {
            ...item,
            vencimento: item.vencimento,
            pagaEm: null,
            frequencia: item.frequencia,
            parcelaAtual: item.parcelaAtual,
            parcelasTotais: item.parcelasTotais
          },
          false
        )
      );

    const salary = sumBy(incomes.filter((item) => item.titulo.toLowerCase().includes("sal")), (item) => item.valorCentavos);
    const freelance = sumBy(incomes.filter((item) => !item.titulo.toLowerCase().includes("sal")), (item) => item.valorCentavos);
    const totalMonthlyCents = salary + freelance;
    const contributionCents = currentContribution?.valorCentavos ?? 0;

    return {
      monthLabel: getMonthLabel(),
      totalMonthly: toCurrencyValue(totalMonthlyCents),
      salary: toCurrencyValue(salary),
      freelance: toCurrencyValue(freelance),
      declaredContribution: toCurrencyValue(contributionCents),
      weeklyBills,
      goals: goals.map((goal) => {
        const spent = sumBy(expenses.filter((expense) => expense.categoria === goal.categoria), (expense) => expense.valorCentavos);
        const ratio = goal.valorMetaCentavos > 0 ? spent / goal.valorMetaCentavos : 0;
        const tone: "success" | "amber" | "danger" = ratio <= 0.6 ? "success" : ratio <= 0.9 ? "amber" : "danger";
        return {
          id: goal.id, label: goal.categoria, icon: goal.categoria.toLowerCase().includes("trans") ? "Car" : goal.categoria.toLowerCase().includes("meta") ? "Target" : "Utensils",
          spent: toCurrencyValue(spent), limit: toCurrencyValue(goal.valorMetaCentavos), tone, month: goal.mes, year: goal.ano
        };
      }),
      incomes: incomes.map<IncomeRecord>((item) => {
        const recurrence = frequencyToUi(item.frequencia, item.parcelaAtual, item.parcelasTotais);

        return {
          id: item.id,
          title: item.titulo,
          amount: toCurrencyValue(item.valorCentavos),
          receivedDate: dateInputValue(item.recebidaEm),
          recurrenceType: recurrence.recurrenceType,
          recurrenceLabel: recurrence.recurrenceLabel,
          installmentLabel: recurrence.installmentLabel,
          installmentCurrent: item.parcelaAtual ?? undefined,
          installmentTotal: item.parcelasTotais ?? undefined
        };
      }),
      personalBills: personalBills.map<PersonalBillRecord>((item) => {
        const recurrence = frequencyToUi(item.frequencia, item.parcelaAtual, item.parcelasTotais);

        return {
          id: item.id,
          title: item.titulo,
          category: item.categoria,
          amount: toCurrencyValue(item.valorCentavos),
          dueLabel: formatDueLabel(item.vencimento, "Vence em"),
          dueDate: dateInputValue(item.vencimento),
          status: toBillStatus(item.status, item.vencimento),
          note: item.observacao ?? undefined,
          recurrenceType: recurrence.recurrenceType,
          recurrenceLabel: recurrence.recurrenceLabel,
          installmentLabel: recurrence.installmentLabel,
          installmentCurrent: item.parcelaAtual ?? undefined,
          installmentTotal: item.parcelasTotais ?? undefined
        };
      }),
      expenses: expenses.map<ExpenseRecord>((item) => ({ id: item.id, title: item.titulo, category: item.categoria, amount: toCurrencyValue(item.valorCentavos), expenseDate: dateInputValue(item.gastoEm) }))
    };
  },
  async getPersonalGoals(userId: string) { return (await this.getPersonalSnapshot(userId)).goals; }
};
