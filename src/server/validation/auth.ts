import { z } from "zod";

export const registerSchema = z.object({
  nome: z.string().min(2, "Informe seu nome."),
  email: z.string().email("E-mail invalido."),
  senha: z.string().min(8, "A senha precisa ter ao menos 8 caracteres.")
});

export const loginSchema = z.object({
  email: z.string().email("E-mail invalido."),
  senha: z.string().min(1, "Informe a senha.")
});

