import { describe, it, expect } from "vitest";
import {
  createHouseSchema,
  joinHouseSchema,
  contributionSchema,
  houseBillSchema,
} from "@/server/validation/house";

describe("createHouseSchema", () => {
  it("accepts valid house name", () => {
    expect(createHouseSchema.safeParse({ nome: "Casa 1" }).success).toBe(true);
  });
  it("rejects short name", () => {
    expect(createHouseSchema.safeParse({ nome: "C" }).success).toBe(false);
  });
});

describe("joinHouseSchema", () => {
  it("accepts valid invite code", () => {
    expect(joinHouseSchema.safeParse({ codigoConvite: "ABCD1234" }).success).toBe(true);
  });
  it("rejects short code", () => {
    expect(joinHouseSchema.safeParse({ codigoConvite: "AB" }).success).toBe(false);
  });
});

describe("contributionSchema", () => {
  it("accepts valid contribution", () => {
    const result = contributionSchema.safeParse({ valor: 100, mes: 3, ano: 2026 });
    expect(result.success).toBe(true);
  });
  it("rejects negative value", () => {
    expect(contributionSchema.safeParse({ valor: -10, mes: 3, ano: 2026 }).success).toBe(false);
  });
  it("rejects invalid month", () => {
    expect(contributionSchema.safeParse({ valor: 100, mes: 13, ano: 2026 }).success).toBe(false);
    expect(contributionSchema.safeParse({ valor: 100, mes: 0, ano: 2026 }).success).toBe(false);
  });
});

describe("houseBillSchema", () => {
  it("accepts valid bill", () => {
    const result = houseBillSchema.safeParse({
      titulo: "Aluguel",
      categoria: "Moradia",
      valor: 1500,
      vencimento: "2026-03-15",
    });
    expect(result.success).toBe(true);
  });
  it("accepts bill with optional observacao", () => {
    const result = houseBillSchema.safeParse({
      titulo: "Luz",
      categoria: "Utilidade",
      valor: 200,
      vencimento: "2026-04-01",
      observacao: "Conta alta",
    });
    expect(result.success).toBe(true);
  });
  it("rejects invalid date", () => {
    const result = houseBillSchema.safeParse({
      titulo: "Luz",
      categoria: "Utilidade",
      valor: 200,
      vencimento: "not-a-date",
    });
    expect(result.success).toBe(false);
  });
});
