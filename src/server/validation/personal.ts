import { z } from "zod";
import { toCents } from "@/lib/utils";

const recurrenceFields = {
  frequencia: z.enum(["UNICA", "MENSAL", "PARCELADA", "FIXA"]).default("UNICA"),
  parcelasTotais: z.coerce.number().int().positive().optional().nullable()
};

function validateRecurrence(
  data: {
    frequencia: "UNICA" | "MENSAL" | "PARCELADA" | "FIXA";
    parcelasTotais?: number | null;
  },
  ctx: z.RefinementCtx
) {
  if (data.frequencia === "PARCELADA" && !data.parcelasTotais) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["parcelasTotais"],
      message: "Informe a quantidade de parcelas."
    });
  }
}

export const incomeSchema = z.object({
  titulo: z.string().min(2, "Informe o titulo."),
  categoria: z.enum(["SALARIO", "EXTRA"]).default("SALARIO"),
  valor: z.coerce.number().positive("Informe um valor valido."),
  recebidaEm: z.string().date("Informe uma data valida."),
  status: z.enum(["PREVISTO", "RECEBIDO"]).default("PREVISTO"),
  ...recurrenceFields
}).superRefine(validateRecurrence).transform(data => ({
  ...data,
  valorCentavos: toCents(data.valor),
  recebidaEmDate: new Date(data.recebidaEm),
  parcelasTotais: data.frequencia === "PARCELADA" ? data.parcelasTotais ?? undefined : undefined
}));

export const personalBillSchema = z.object({
  titulo: z.string().min(2, "Informe o titulo."),
  categoria: z.string().min(2, "Informe a categoria."),
  valor: z.coerce.number().positive("Informe um valor valido."),
  vencimento: z.string().date("Informe uma data valida."),
  observacao: z.string().optional().or(z.literal("")),
  ...recurrenceFields
}).superRefine(validateRecurrence).transform(data => ({
  ...data,
  valorCentavos: toCents(data.valor),
  vencimentoDate: new Date(data.vencimento),
  parcelasTotais: data.frequencia === "PARCELADA" ? data.parcelasTotais ?? undefined : undefined
}));

export const updatePersonalBillSchema = z.object({
  titulo: z.string().min(2, "Informe o titulo."),
  categoria: z.string().min(2, "Informe a categoria."),
  valor: z.coerce.number().positive("Informe um valor valido."),
  vencimento: z.string().date("Informe uma data valida."),
  observacao: z.string().optional().or(z.literal("")),
  status: z.enum(["PENDENTE", "PAGA"]).optional(),
  ...recurrenceFields
}).superRefine(validateRecurrence).transform(data => ({
  ...data,
  valorCentavos: toCents(data.valor),
  vencimentoDate: new Date(data.vencimento),
  parcelasTotais: data.frequencia === "PARCELADA" ? data.parcelasTotais ?? undefined : undefined
}));

export const expenseSchema = z.object({
  titulo: z.string().min(2, "Informe o titulo."),
  categoria: z.string().min(2, "Informe a categoria."),
  valor: z.coerce.number().positive("Informe um valor valido."),
  gastoEm: z.string().date("Informe uma data valida.")
}).transform(data => ({
  ...data,
  valorCentavos: toCents(data.valor),
  gastoEmDate: new Date(data.gastoEm)
}));

export const budgetGoalSchema = z.object({
  categoria: z.string().min(2, "Informe a categoria."),
  valorMeta: z.coerce.number().positive("Informe um valor valido."),
  mes: z.coerce.number().int().min(1).max(12),
  ano: z.coerce.number().int().min(2024).max(2100)
}).transform(data => ({
  ...data,
  valorMetaCentavos: toCents(data.valorMeta)
}));

export const updateBudgetGoalSchema = z.object({
  categoria: z.string().min(2, "Informe a categoria."),
  valorMeta: z.coerce.number().positive("Informe um valor valido.")
}).transform(data => ({
  ...data,
  valorMetaCentavos: toCents(data.valorMeta)
}));
