import { prisma } from "@/lib/prisma";
import { UserFacingError } from "@/server/http/errors";
import type { CreateUserInput } from "./_types";

export const authRepository = {
  async createUser(input: CreateUserInput) {
    return prisma.morador.create({
      data: input,
      select: { id: true }
    });
  },

  async findUserByAuthUserId(authUserId: string) {
    return prisma.morador.findUnique({
      where: { authUserId },
      select: { id: true, nome: true, email: true, casaId: true }
    });
  },

  async syncUserIdentity(input: {
    authUserId: string;
    email: string;
    nome: string;
    emailVerified: boolean;
  }) {
    const existingByAuth = await prisma.morador.findUnique({
      where: { authUserId: input.authUserId },
      select: { id: true, casaId: true }
    });

    if (existingByAuth) {
      return prisma.morador.update({
        where: { id: existingByAuth.id },
        data: { email: input.email, nome: input.nome },
        select: { id: true, casaId: true }
      });
    }

    const existingByEmail = await prisma.morador.findUnique({
      where: { email: input.email },
      select: { id: true, casaId: true }
    });

    if (existingByEmail) {
      if (!input.emailVerified) {
        throw new UserFacingError("A conta Google precisa trazer um e-mail verificado.", 403);
      }

      return prisma.morador.update({
        where: { id: existingByEmail.id },
        data: { authUserId: input.authUserId, nome: input.nome },
        select: { id: true, casaId: true }
      });
    }

    return prisma.morador.create({
      data: {
        authUserId: input.authUserId,
        nome: input.nome,
        email: input.email,
        senhaHash: "SUPABASE_OAUTH"
      },
      select: { id: true, casaId: true }
    });
  }
};
