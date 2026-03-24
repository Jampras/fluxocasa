import { z } from "zod";
import { parseDateInput, toCents } from "@/lib/utils";

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

export const createHouseSchema = z.object({
  nome: z.string().min(2, "Informe o nome da casa.")
});

export const joinHouseSchema = z.object({
  codigoConvite: z.string().min(4, "Informe o codigo de convite.")
});

export const contributionSchema = z.object({
  valor: z.coerce.number().positive("Informe um valor valido."),
  mes: z.coerce.number().int().min(1).max(12),
  ano: z.coerce.number().int().min(2024).max(2100)
}).transform(data => ({
  ...data,
  valorCentavos: toCents(data.valor)
}));

export const houseBillSchema = z.object({
  titulo: z.string().min(2, "Informe o titulo."),
  categoria: z.string().min(2, "Informe a categoria."),
  valor: z.coerce.number().positive("Informe um valor valido."),
  vencimento: z.string().date("Informe uma data valida."),
  observacao: z.string().optional().or(z.literal("")),
  ...recurrenceFields
}).superRefine(validateRecurrence).transform(data => ({
  ...data,
  valorCentavos: toCents(data.valor),
  vencimentoDate: parseDateInput(data.vencimento),
  parcelasTotais: data.frequencia === "PARCELADA" ? data.parcelasTotais ?? undefined : undefined
}));

export const updateHouseBillSchema = z.object({
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
  vencimentoDate: parseDateInput(data.vencimento),
  parcelasTotais: data.frequencia === "PARCELADA" ? data.parcelasTotais ?? undefined : undefined
}));
