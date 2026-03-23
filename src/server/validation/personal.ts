import { z } from "zod";
import { toCents } from "@/lib/utils";

export const incomeSchema = z.object({
  titulo: z.string().min(2, "Informe o titulo."),
  valor: z.coerce.number().positive("Informe um valor valido."),
  recebidaEm: z.string().date("Informe uma data valida.")
}).transform(data => ({
  ...data,
  valorCentavos: toCents(data.valor),
  recebidaEmDate: new Date(data.recebidaEm)
}));

export const personalBillSchema = z.object({
  titulo: z.string().min(2, "Informe o titulo."),
  categoria: z.string().min(2, "Informe a categoria."),
  valor: z.coerce.number().positive("Informe um valor valido."),
  vencimento: z.string().date("Informe uma data valida."),
  observacao: z.string().optional().or(z.literal(""))
}).transform(data => ({
  ...data,
  valorCentavos: toCents(data.valor),
  vencimentoDate: new Date(data.vencimento)
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
