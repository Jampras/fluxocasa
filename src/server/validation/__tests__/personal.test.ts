import { describe, expect, it } from "vitest";

import {
  budgetGoalSchema,
  expenseSchema,
  incomeSchema,
  personalBillSchema,
  updateBudgetGoalSchema,
  updatePersonalBillSchema,
} from "@/server/validation/personal";

describe("incomeSchema", () => {
  it("accepts valid income", () => {
    const result = incomeSchema.safeParse({
      titulo: "Salario",
      categoria: "SALARIO",
      valor: 5000,
      recebidaEm: "2026-03-01",
      status: "RECEBIDO",
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero value", () => {
    expect(
      incomeSchema.safeParse({
        titulo: "X",
        categoria: "SALARIO",
        valor: 0,
        recebidaEm: "2026-01-01",
      }).success
    ).toBe(false);
  });

  it("defaults income status to previsto", () => {
    const result = incomeSchema.parse({
      titulo: "Freela",
      categoria: "EXTRA",
      valor: 200,
      recebidaEm: "2026-03-02",
    });

    expect(result.status).toBe("PREVISTO");
  });
});

describe("personalBillSchema", () => {
  it("accepts valid bill", () => {
    const result = personalBillSchema.safeParse({
      titulo: "Netflix",
      categoria: "Assinaturas",
      valor: 39.9,
      vencimento: "2026-03-10",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing category", () => {
    const result = personalBillSchema.safeParse({
      titulo: "Netflix",
      valor: 39.9,
      vencimento: "2026-03-10",
    });
    expect(result.success).toBe(false);
  });
});

describe("updatePersonalBillSchema", () => {
  it("accepts a paid status update", () => {
    const result = updatePersonalBillSchema.safeParse({
      titulo: "Netflix",
      categoria: "Assinaturas",
      valor: 39.9,
      vencimento: "2026-03-10",
      status: "PAGA",
    });
    expect(result.success).toBe(true);
  });
});

describe("expenseSchema", () => {
  it("accepts valid expense", () => {
    const result = expenseSchema.safeParse({
      titulo: "Mercado",
      categoria: "Alimentacao",
      valor: 150,
      gastoEm: "2026-03-05",
    });
    expect(result.success).toBe(true);
  });
});

describe("budgetGoalSchema", () => {
  it("accepts valid goal", () => {
    const result = budgetGoalSchema.safeParse({
      categoria: "Alimentacao",
      valorMeta: 800,
      mes: 3,
      ano: 2026,
    });
    expect(result.success).toBe(true);
  });

  it("rejects year below 2024", () => {
    expect(
      budgetGoalSchema.safeParse({
        categoria: "X",
        valorMeta: 100,
        mes: 1,
        ano: 2023,
      }).success
    ).toBe(false);
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
