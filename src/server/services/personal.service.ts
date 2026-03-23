import { fluxoCasaRepository } from "@/server/repositories/fluxocasa.repository";

/**
 * Retorna o panorama financeiro pessoal (Renda vs Contas vs Balanço).
 * @param userId ID do morador.
 */
export async function getPersonalSnapshot(userId: string) {
  return fluxoCasaRepository.getPersonalSnapshot(userId);
}

/**
 * Retorna as metas de orçamento (budgeting) vs gastos reais por categoria.
 */
export async function getPersonalGoals(userId: string) {
  return fluxoCasaRepository.getPersonalGoals(userId);
}

/**
 * Registra uma nova fonte de renda pessoal.
 */
export async function createIncome(
  userId: string,
  input: { titulo: string; valorCentavos: number; recebidaEm: Date }
) {
  return fluxoCasaRepository.createIncome(userId, input);
}

/**
 * Atualiza uma entrada de renda existente.
 */
export async function updateIncome(
  userId: string,
  incomeId: string,
  input: { titulo: string; valorCentavos: number; recebidaEm: Date }
) {
  return fluxoCasaRepository.updateIncome(userId, incomeId, input);
}

/**
 * Remove uma entrada de renda.
 */
export async function deleteIncome(userId: string, incomeId: string) {
  return fluxoCasaRepository.deleteIncome(userId, incomeId);
}

/**
 * Registra uma conta pessoal recorrente ou pontual.
 */
export async function createPersonalBill(
  userId: string,
  input: { titulo: string; categoria: string; valorCentavos: number; vencimento: Date; observacao?: string }
) {
  return fluxoCasaRepository.createPersonalBill(userId, input);
}

/**
 * Atualiza uma conta pessoal existente.
 */
export async function updatePersonalBill(
  userId: string,
  billId: string,
  input: {
    titulo: string;
    categoria: string;
    valorCentavos: number;
    vencimento: Date;
    observacao?: string;
    status?: string;
  }
) {
  return fluxoCasaRepository.updatePersonalBill(userId, billId, input);
}

/**
 * Remove uma conta pessoal.
 */
export async function deletePersonalBill(userId: string, billId: string) {
  return fluxoCasaRepository.deletePersonalBill(userId, billId);
}

/**
 * Registra um gasto variável (ex: mercado, farmácia).
 */
export async function createExpense(
  userId: string,
  input: { titulo: string; categoria: string; valorCentavos: number; gastoEm: Date }
) {
  return fluxoCasaRepository.createExpense(userId, input);
}

/**
 * Atualiza um gasto registrado.
 */
export async function updateExpense(
  userId: string,
  expenseId: string,
  input: { titulo: string; categoria: string; valorCentavos: number; gastoEm: Date }
) {
  return fluxoCasaRepository.updateExpense(userId, expenseId, input);
}

/**
 * Remove um registro de gasto.
 */
export async function deleteExpense(userId: string, expenseId: string) {
  return fluxoCasaRepository.deleteExpense(userId, expenseId);
}

/**
 * Define ou atualiza uma meta de teto de gastos para uma categoria no mês.
 */
export async function upsertBudgetGoal(
  userId: string,
  input: { categoria: string; valorMetaCentavos: number; mes: number; ano: number }
) {
  return fluxoCasaRepository.upsertBudgetGoal(userId, input);
}

/**
 * Atualiza apenas os valores de uma meta existente.
 */
export async function updateBudgetGoal(
  userId: string,
  goalId: string,
  input: { categoria: string; valorMetaCentavos: number }
) {
  return fluxoCasaRepository.updateBudgetGoal(userId, goalId, input);
}

/**
 * Remove uma meta de orçamento.
 */
export async function deleteBudgetGoal(userId: string, goalId: string) {
  return fluxoCasaRepository.deleteBudgetGoal(userId, goalId);
}
