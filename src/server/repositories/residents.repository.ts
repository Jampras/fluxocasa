import { prisma } from "@/lib/prisma";
import { UserFacingError } from "@/server/http/errors";
import type { HouseAuditEvent, ResidentsSnapshot } from "@/types";
import {
  AUDIT_ADMIN_TRANSFERRED,
  AUDIT_MEMBER_REMOVED,
  ROLE_ADMIN,
  ROLE_MEMBER,
  auditTitle,
  createHouseAuditEntry,
  ensureCurrentCycle,
  formatAuditDate,
  getMonthLabel,
  getMonthYear,
  initials,
  mapAuditDescription,
  requireHouseAdmin,
  roleToUi
} from "./_shared";

export const residentsRepository = {
  async getResidentsSnapshot(userId: string): Promise<ResidentsSnapshot> {
    const user = await prisma.morador.findUnique({
      where: { id: userId },
      select: {
        casaId: true,
        role: true,
        casa: {
          select: {
            id: true,
            nome: true,
            codigoConvite: true,
            moradores: {
              select: {
                id: true,
                nome: true,
                avatarUrl: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!user?.casa) {
      throw new UserFacingError("Usuario ainda nao participa de uma casa.");
    }

    const auditLog = await prisma.auditoriaCasa.findMany({
      where: { casaId: user.casa.id },
      include: {
        ator: { select: { nome: true } },
        alvo: { select: { nome: true } }
      },
      orderBy: { criadoEm: "desc" },
      take: 6
    });

    return {
      monthLabel: getMonthLabel(),
      houseName: user.casa.nome,
      inviteCode: user.casa.codigoConvite,
      currentUserRole: roleToUi(user.role),
      canManageResidents: user.role === ROLE_ADMIN,
      residents: user.casa.moradores
        .map((resident) => ({
          id: resident.id,
          name: resident.nome,
          avatar: resident.avatarUrl || initials(resident.nome),
          role: roleToUi(resident.role),
          isCurrentUser: resident.id === userId,
          online: true
        }))
        .sort((a, b) => {
          if (a.role !== b.role) return a.role === "ADMIN" ? -1 : 1;
          if (a.isCurrentUser !== b.isCurrentUser) return a.isCurrentUser ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
      auditLog: auditLog.map((entry) => ({
        id: entry.id,
        type: entry.tipo as HouseAuditEvent["type"],
        title: auditTitle(entry.tipo),
        description: mapAuditDescription(entry),
        createdAtLabel: formatAuditDate(entry.criadoEm)
      }))
    };
  },

  async transferHouseAdmin(userId: string, residentId: string) {
    const admin = await requireHouseAdmin(userId);

    if (residentId === userId) {
      throw new UserFacingError("Selecione outro morador para transferir a administracao.");
    }

    const target = await prisma.morador.findUnique({ where: { id: residentId } });

    if (!target || target.casaId !== admin.casaId) {
      throw new UserFacingError("Morador nao encontrado nesta casa.", 404);
    }

    if (target.role === ROLE_ADMIN) {
      throw new UserFacingError("Este morador ja e administrador.");
    }

    await prisma.$transaction([
      prisma.morador.update({ where: { id: userId }, data: { role: ROLE_MEMBER } }),
      prisma.morador.update({ where: { id: residentId }, data: { role: ROLE_ADMIN } })
    ]);

    await createHouseAuditEntry({
      casaId: admin.casaId!,
      type: AUDIT_ADMIN_TRANSFERRED,
      description: "Administracao transferida para outro morador da casa.",
      actorResidentId: userId,
      targetResidentId: residentId
    });
  },

  async removeHouseResident(userId: string, residentId: string) {
    const admin = await requireHouseAdmin(userId);

    if (residentId === userId) {
      throw new UserFacingError("Transfira a administracao antes de sair da casa.", 403);
    }

    const target = await prisma.morador.findUnique({ where: { id: residentId } });

    if (!target || target.casaId !== admin.casaId) {
      throw new UserFacingError("Morador nao encontrado nesta casa.", 404);
    }

    if (target.role === ROLE_ADMIN) {
      throw new UserFacingError("Nao e possivel remover outro administrador.", 403);
    }

    const { month, year } = getMonthYear();

    await prisma.$transaction([
      prisma.contribuicao.deleteMany({
        where: {
          moradorId: residentId,
          casaId: admin.casaId!,
          OR: [
            { ano: { gt: year } },
            { ano: year, mes: { gte: month } }
          ]
        }
      }),
      prisma.morador.update({
        where: { id: residentId },
        data: { casaId: null, role: ROLE_MEMBER }
      })
    ]);

    await ensureCurrentCycle(admin.casaId!, month, year);
    await createHouseAuditEntry({
      casaId: admin.casaId!,
      type: AUDIT_MEMBER_REMOVED,
      description: "Morador removido da casa e contribuicoes futuras limpas.",
      actorResidentId: userId,
      targetResidentId: residentId
    });
  }
};
