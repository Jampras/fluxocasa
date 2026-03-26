import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { toCurrencyValue } from "@/lib/utils";
import { UserFacingError } from "@/server/http/errors";
import type { PersonalSnapshot, IncomeRecord, PersonalBillRecord, ExpenseRecord, IncomeStatus } from "@/types";
import type { CreateIncomeInput, UpdateIncomeInput, CreatePersonalBillInput, UpdatePersonalBillInput, CreateExpenseInput, UpdateExpenseInput, UpsertBudgetGoalInput, UpdateBudgetGoalInput } from "./_types";
import { dateInputValue, formatDueLabel, frequencyToUi, getMonthLabel, getMonthRange, getMonthYear, mapHouseBill, sumBy, toBillStatus } from "./_shared";
import { ensurePersonalRecurringTransactions, invalidateRecurringSyncState } from "./_recurrence";
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

function normalizeIncomeCategory(category: string) {
  return category === "SALARIO" ? "SALARIO" : "EXTRA";
}

function incomeUiStatus(status: StatusTransacao): IncomeStatus {
  return status === StatusTransacao.CONCLUIDA ? "received" : "scheduled";
}

function incomeStatusToDb(status?: "PREVISTO" | "RECEBIDO") {
  return status === "RECEBIDO" ? StatusTransacao.CONCLUIDA : StatusTransacao.PENDENTE;
}

function incomeCategoryLabel(category: string) {
  return category === "SALARIO" ? "Salario" : "Renda extra";
}

export const personalRepository = {
  async createIncome(userId: string, input: CreateIncomeInput) {
    const recurrence = buildRecurringData(input.frequencia, input.parcelasTotais);
    const status = incomeStatusToDb(input.status);

    await prisma.transacao.create({
      data: {
        moradorId: userId,
        titulo: input.titulo,
        valorCentavos: input.valorCentavos,
        categoria: normalizeIncomeCategory(input.categoria),
        dataVencimento: input.recebidaEm,
        dataPagamento: status === StatusTransacao.CONCLUIDA ? input.recebidaEm : null,
        escopo: EscopoTransacao.PESSOAL,
        tipo: TipoTransacao.RECEITA,
        frequencia: recurrence.frequencia,
        serieId: recurrence.serieId,
        parcelaAtual: recurrence.parcelaAtual,
        parcelasTotais: recurrence.parcelasTotais,
        status
      }
    });
    await invalidateRecurringSyncState(EscopoTransacao.PESSOAL, userId);
  },
  async updateIncome(userId: string, incomeId: string, input: UpdateIncomeInput) {
    const income = await prisma.transacao.findUnique({ where: { id: incomeId } });
    if (!income || income.moradorId !== userId) throw new UserFacingError("Renda nao encontrada.", 404);
    const frequency = input.frequencia as FrequenciaTransacao;
    const status = incomeStatusToDb(input.status);
    await prisma.transacao.update({
      where: { id: incomeId },
      data: {
        titulo: input.titulo,
        categoria: normalizeIncomeCategory(input.categoria),
        valorCentavos: input.valorCentavos,
        dataVencimento: input.recebidaEm,
        dataPagamento: status === StatusTransacao.CONCLUIDA ? income.dataPagamento ?? input.recebidaEm : null,
        frequencia: frequency,
        serieId: frequency === FrequenciaTransacao.UNICA ? null : income.serieId ?? randomUUID(),
        parcelaAtual: frequency === FrequenciaTransacao.PARCELADA ? income.parcelaAtual ?? 1 : null,
        parcelasTotais: frequency === FrequenciaTransacao.PARCELADA ? input.parcelasTotais ?? income.parcelasTotais ?? 1 : null,
        status
      }
    });
    await invalidateRecurringSyncState(EscopoTransacao.PESSOAL, userId);
  },
  async markIncomeAsReceived(userId: string, incomeId: string) {
    const income = await prisma.transacao.findUnique({ where: { id: incomeId } });
    if (!income || income.moradorId !== userId || income.tipo !== TipoTransacao.RECEITA) throw new UserFacingError("Renda nao encontrada.", 404);
    await prisma.transacao.update({
      where: { id: incomeId },
      data: { status: StatusTransacao.CONCLUIDA, dataPagamento: income.dataPagamento ?? new Date() }
    });
  },
  async deleteIncome(userId: string, incomeId: string) {
    const t = await prisma.transacao.findUnique({ where: { id: incomeId } });
    if (!t || t.moradorId !== userId) throw new UserFacingError("Renda nao encontrada.", 404);
    await prisma.transacao.delete({ where: { id: incomeId } });
    await invalidateRecurringSyncState(EscopoTransacao.PESSOAL, userId);
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
    await invalidateRecurringSyncState(EscopoTransacao.PESSOAL, userId);
  },
  async updatePersonalBill(userId: string, billId: string, input: UpdatePersonalBillInput) {
    const bill = await prisma.transacao.findUnique({ where: { id: billId } });
    if (!bill || bill.moradorId !== userId) throw new UserFacingError("Conta pessoal nao encontrada.", 404);
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
    await invalidateRecurringSyncState(EscopoTransacao.PESSOAL, userId);
  },
  async markPersonalBillAsPaid(userId: string, billId: string) {
    const bill = await prisma.transacao.findUnique({ where: { id: billId } });
    if (!bill || bill.moradorId !== userId) throw new UserFacingError("Conta pessoal nao encontrada.", 404);
    await prisma.transacao.update({
      where: { id: billId },
      data: { status: StatusTransacao.CONCLUIDA, dataPagamento: bill.dataPagamento ?? new Date() }
    });
  },
  async deletePersonalBill(userId: string, billId: string) {
    const bill = await prisma.transacao.findUnique({ where: { id: billId } });
    if (!bill || bill.moradorId !== userId) throw new UserFacingError("Conta pessoal nao encontrada.", 404);
    await prisma.transacao.delete({ where: { id: billId } });
    await invalidateRecurringSyncState(EscopoTransacao.PESSOAL, userId);
  },
  async createExpense(userId: string, input: CreateExpenseInput) {
    await prisma.transacao.create({
      data: { moradorId: userId, titulo: input.titulo, categoria: input.categoria, valorCentavos: input.valorCentavos, dataVencimento: input.gastoEm, escopo: EscopoTransacao.PESSOAL, tipo: TipoTransacao.DESPESA, frequencia: "UNICA", status: StatusTransacao.CONCLUIDA }
    });
  },
  async updateExpense(userId: string, expenseId: string, input: UpdateExpenseInput) {
    const expense = await prisma.transacao.findUnique({ where: { id: expenseId } });
    if (!expense || expense.moradorId !== userId) throw new UserFacingError("Gasto nao encontrado.", 404);
    await prisma.transacao.update({
      where: { id: expenseId },
      data: { titulo: input.titulo, categoria: input.categoria, valorCentavos: input.valorCentavos, dataVencimento: input.gastoEm }
    });
  },
  async deleteExpense(userId: string, expenseId: string) {
    const expense = await prisma.transacao.findUnique({ where: { id: expenseId } });
    if (!expense || expense.moradorId !== userId) throw new UserFacingError("Gasto nao encontrado.", 404);
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
    if (!goal || goal.moradorId !== userId) throw new UserFacingError("Meta nao encontrada.", 404);
    await prisma.metaOrcamento.update({ where: { id: goalId }, data: { categoria: input.categoria, valorMetaCentavos: input.valorMetaCentavos } });
  },
  async deleteBudgetGoal(userId: string, goalId: string) {
    const goal = await prisma.metaOrcamento.findUnique({ where: { id: goalId } });
    if (!goal || goal.moradorId !== userId) throw new UserFacingError("Meta nao encontrada.", 404);
    await prisma.metaOrcamento.delete({ where: { id: goalId } });
  },

  async getPersonalSnapshot(userId: string): Promise<PersonalSnapshot> {
    const { month, year } = getMonthYear();
    const { start, end } = getMonthRange(month, year);
    await ensurePersonalRecurringTransactions(userId);
    const resident = await prisma.morador.findUnique({
      where: { id: userId },
      select: { id: true, casaId: true }
    });

    if (!resident) throw new UserFacingError("Usuario nao encontrado.", 404);

    const [transactions, goals, currentContribution] = await Promise.all([
      prisma.transacao.findMany({
        where: {
          moradorId: userId,
          escopo: EscopoTransacao.PESSOAL,
          dataVencimento: { gte: start, lt: end }
        },
        orderBy: { dataVencimento: "desc" },
        select: {
          id: true,
          titulo: true,
          categoria: true,
          valorCentavos: true,
          status: true,
          tipo: true,
          dataVencimento: true,
          dataPagamento: true,
          frequencia: true,
          parcelaAtual: true,
          parcelasTotais: true,
          observacao: true
        }
      }),
      prisma.metaOrcamento.findMany({
        where: { moradorId: userId, mes: month, ano: year },
        orderBy: { categoria: "asc" }
      }),
      resident.casaId
        ? prisma.contribuicao.findFirst({
            where: {
              moradorId: userId,
              casaId: resident.casaId,
              mes: month,
              ano: year
            }
          })
        : Promise.resolve(null)
    ]);

    const rendas = transactions
      .filter((transaction) => transaction.tipo === TipoTransacao.RECEITA)
      .map((transaction) => ({
        ...transaction,
        recebidaEm: transaction.dataPagamento,
        previstaEm: transaction.dataVencimento
      }))
      .sort((a, b) => (b.recebidaEm ?? b.previstaEm).getTime() - (a.recebidaEm ?? a.previstaEm).getTime());
    const personalBills = transactions
      .filter((transaction) => transaction.tipo === TipoTransacao.DESPESA && transaction.status === StatusTransacao.PENDENTE)
      .map((transaction) => ({ ...transaction, vencimento: transaction.dataVencimento }))
      .sort((a, b) => a.vencimento.getTime() - b.vencimento.getTime());
    const expenses = transactions
      .filter((transaction) => transaction.tipo === TipoTransacao.DESPESA && transaction.status === StatusTransacao.CONCLUIDA)
      .map((transaction) => ({ ...transaction, gastoEm: transaction.dataVencimento }))
      .sort((a, b) => b.gastoEm.getTime() - a.gastoEm.getTime());
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

    const settledIncomes = rendas.filter((item) => item.status === StatusTransacao.CONCLUIDA);
    const salary = sumBy(settledIncomes.filter((item) => item.categoria === "SALARIO"), (item) => item.valorCentavos);
    const freelance = sumBy(settledIncomes.filter((item) => item.categoria !== "SALARIO"), (item) => item.valorCentavos);
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
      incomes: rendas.map<IncomeRecord>((item) => {
        const recurrence = frequencyToUi(item.frequencia, item.parcelaAtual, item.parcelasTotais);
        const effectiveReceivedDate = item.recebidaEm ?? item.previstaEm;

        return {
          id: item.id,
          title: item.titulo,
          amount: toCurrencyValue(item.valorCentavos),
          categoryLabel: incomeCategoryLabel(item.categoria),
          status: incomeUiStatus(item.status),
          statusLabel: item.status === StatusTransacao.CONCLUIDA ? "Recebido" : "Previsto",
          dateLabel:
            item.status === StatusTransacao.CONCLUIDA
              ? formatDueLabel(effectiveReceivedDate, "Recebido em")
              : formatDueLabel(item.previstaEm, "Previsto em"),
          plannedDate: dateInputValue(item.previstaEm),
          referenceDate: dateInputValue(effectiveReceivedDate),
          receivedDate: item.status === StatusTransacao.CONCLUIDA ? dateInputValue(effectiveReceivedDate) : undefined,
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
