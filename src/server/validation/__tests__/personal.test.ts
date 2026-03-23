import { describe, it, expect } from "vitest";
import {
  incomeSchema,
  personalBillSchema,
  expenseSchema,
  budgetGoalSchema,
  updateBudgetGoalSchema,
} from "@/server/validation/personal";

describe("incomeSchema", () => {
  it("accepts valid income", () => {
    const result = incomeSchema.safeParse({
      titulo: "Salário",
      valor: 5000,
      recebidaEm: "2026-03-01",
    });
    expect(result.success).toBe(true);
  });
  it("rejects zero value", () => {
    expect(incomeSchema.safeParse({ titulo: "X", valor: 0, recebidaEm: "2026-01-01" }).success).toBe(false);
  });
});

describe("personalBillSchema", () => {
  it("accepts valid bill", () => {
    const result = personalBillSchema.safeParse({
      titulo: "Netflix",
      categoria: "Assinaturas",
      valor: 39.90,
      vencimento: "2026-03-10",
    });
    expect(result.success).toBe(true);
  });
  it("rejects missing categoria", () => {
    const result = personalBillSchema.safeParse({
      titulo: "Netflix",
      valor: 39.90,
      vencimento: "2026-03-10",
    });
    expect(result.success).toBe(false);
  });
});

describe("expenseSchema", () => {
  it("accepts valid expense", () => {
    const result = expenseSchema.safeParse({
      titulo: "Mercado",
      categoria: "Alimentação",
      valor: 150,
      gastoEm: "2026-03-05",
    });
    expect(result.success).toBe(true);
  });
});

describe("budgetGoalSchema", () => {
  it("accepts valid goal", () => {
    const result = budgetGoalSchema.safeParse({
      categoria: "Alimentação",
      valorMeta: 800,
      mes: 3,
      ano: 2026,
    });
    expect(result.success).toBe(true);
  });
  it("rejects year below 2024", () => {
    expect(budgetGoalSchema.safeParse({
      categoria: "X",
      valorMeta: 100,
      mes: 1,
      ano: 2023,
    }).success).toBe(false);
  });
});

describe("updateBudgetGoalSchema", () => {
  it("accepts valid update", () => {
    const result = updateBudgetGoalSchema.safeParse({
      categoria: "Transporte",
      valorMeta: 300,
    });
    expect(result.success).toBe(true);
  });
});
