import type { Prisma } from "@prisma/client";

// ─── Input Types ───────────────────────────────────────────

export interface CreateUserInput {
  authUserId?: string;
  nome: string;
  email: string;
  senhaHash: string;
}

export interface CreateHouseInput {
  nome: string;
}

export interface JoinHouseInput {
  codigoConvite: string;
}

export interface LeaveHouseResult {
  action: "LEFT_HOUSE" | "HOUSE_DISSOLVED";
}

export interface UpsertContributionInput {
  valorCentavos: number;
  mes: number;
  ano: number;
}

export interface CreateHouseBillInput {
  titulo: string;
  categoria: string;
  valorCentavos: number;
  vencimento: Date;
  observacao?: string;
  frequencia: "UNICA" | "MENSAL" | "PARCELADA" | "FIXA";
  parcelasTotais?: number;
}

export interface UpdateHouseBillInput extends CreateHouseBillInput {
  status?: string;
}

export interface CreateIncomeInput {
  titulo: string;
  categoria: string;
  valorCentavos: number;
  recebidaEm: Date;
  status?: "PREVISTO" | "RECEBIDO";
  frequencia: "UNICA" | "MENSAL" | "PARCELADA" | "FIXA";
  parcelasTotais?: number;
}

export interface UpdateIncomeInput extends CreateIncomeInput {}

export interface CreatePersonalBillInput {
  titulo: string;
  categoria: string;
  valorCentavos: number;
  vencimento: Date;
  observacao?: string;
  frequencia: "UNICA" | "MENSAL" | "PARCELADA" | "FIXA";
  parcelasTotais?: number;
}

export interface UpdatePersonalBillInput extends CreatePersonalBillInput {
  status?: string;
}

export interface CreateExpenseInput {
  titulo: string;
  categoria: string;
  valorCentavos: number;
  gastoEm: Date;
}

export interface UpdateExpenseInput extends CreateExpenseInput {}

export interface UpsertBudgetGoalInput {
  categoria: string;
  valorMetaCentavos: number;
  mes: number;
  ano: number;
}

export interface UpdateBudgetGoalInput {
  categoria: string;
  valorMetaCentavos: number;
}

// ─── Write union (kept for backward compatibility) ─────────

export type FluxoCasaWriteInput =
  | Prisma.MoradorCreateInput
  | CreateHouseBillInput
  | CreateIncomeInput
  | CreateExpenseInput
  | CreatePersonalBillInput;
