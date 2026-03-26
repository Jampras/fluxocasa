import { z } from "zod";

const baseNoteSchema = z.object({
  titulo: z.string().trim().min(2, "Informe um titulo."),
  conteudo: z.string().trim().max(4000, "A anotacao esta muito longa.").optional().or(z.literal("")),
  tag: z.string().trim().max(40, "A tag esta muito longa.").optional().or(z.literal("")),
  escopo: z.enum(["PESSOAL", "CASA"]),
  isPublica: z.coerce.boolean().optional().default(false)
});

export const noteSchema = baseNoteSchema.transform((data) => ({
  ...data,
  conteudo: data.conteudo?.trim() ?? "",
  tag: data.tag?.trim() ?? "",
  isPublica: data.escopo === "CASA" ? true : data.isPublica
}));

export const updateNoteSchema = noteSchema;
