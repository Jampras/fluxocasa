import { prisma } from "@/lib/prisma";
import { toCurrencyValue } from "@/lib/utils";
import type { HouseSnapshot } from "@/types";
import type { CreateHouseInput, CreateHouseBillInput, JoinHouseInput, LeaveHouseResult, UpdateHouseBillInput, UpsertContributionInput } from "./_types";
import { AUDIT_HOUSE_CREATED, AUDIT_MEMBER_LEFT, AUDIT_MEMBER_JOINED, AUDIT_INVITE_ROTATED, ROLE_ADMIN, ROLE_MEMBER, RECORD_CONFIRMED, STATUS_PAID, createHouseAuditEntry, ensureUserWithoutHouse, ensureCurrentCycle, getMonthLabel, getMonthYear, getUserWithHouse, initials, mapHouseBill, randomInviteCode, requireHouseAdmin, requireHouseMember, roleToUi, sumBy } from "./_shared";
import { EscopoTransacao, TipoTransacao, StatusTransacao } from "@prisma/client";

export const houseRepository = {
  async createHouseForUser(userId: string, input: CreateHouseInput) {
    await ensureUserWithoutHouse(userId);
    const house = await prisma.casa.create({ data: { nome: input.nome, codigoConvite: randomInviteCode() }, select: { id: true } });
    await prisma.morador.update({ where: { id: userId }, data: { casaId: house.id, role: ROLE_ADMIN } });
    const { month, year } = getMonthYear();
    await ensureCurrentCycle(house.id, month, year);
    await createHouseAuditEntry({ casaId: house.id, type: AUDIT_HOUSE_CREATED, description: "Casa criada e administracao inicial definida.", actorResidentId: userId, targetResidentId: userId });
    return { casaId: house.id };
  },
  async joinHouseByInviteCode(userId: string, input: JoinHouseInput) {
    await ensureUserWithoutHouse(userId);
    const house = await prisma.casa.findUnique({ where: { codigoConvite: input.codigoConvite } });
    if (!house) throw new Error("Codigo de convite invalido.");
    await prisma.morador.update({ where: { id: userId }, data: { casaId: house.id, role: ROLE_MEMBER } });
    await createHouseAuditEntry({ casaId: house.id, type: AUDIT_MEMBER_JOINED, description: "Novo morador entrou na casa pelo codigo de convite.", actorResidentId: userId, targetResidentId: userId });
    const { month, year } = getMonthYear();
    await ensureCurrentCycle(house.id, month, year);
    return { casaId: house.id };
  },
  async leaveCurrentHouse(userId: string): Promise<LeaveHouseResult> {
    const user = await requireHouseMember(userId);
    const houseResidents = await prisma.morador.findMany({ where: { casaId: user.casaId! }, select: { id: true } });
    if (user.role === ROLE_ADMIN) {
      if (houseResidents.length > 1) throw new Error("Transfira a administracao antes de sair da casa.");
      await prisma.$transaction(async (tx) => {
        await tx.morador.update({ where: { id: userId }, data: { casaId: null, role: ROLE_MEMBER } });
        await tx.casa.delete({ where: { id: user.casaId! } });
      });
      return { action: "HOUSE_DISSOLVED" };
    }
    const { month, year } = getMonthYear();
    await prisma.$transaction([
      prisma.contribuicao.deleteMany({ where: { moradorId: userId, casaId: user.casaId!, OR: [ { ano: { gt: year } }, { ano: year, mes: { gte: month } } ] } }),
      prisma.morador.update({ where: { id: userId }, data: { casaId: null, role: ROLE_MEMBER } })
    ]);
    await ensureCurrentCycle(user.casaId!, month, year);
    await createHouseAuditEntry({ casaId: user.casaId!, type: AUDIT_MEMBER_LEFT, description: "Morador saiu da casa e contribuicoes futuras foram limpas.", actorResidentId: userId, targetResidentId: userId });
    return { action: "LEFT_HOUSE" };
  },
  async rotateInviteCode(userId: string) {
    const user = await requireHouseAdmin(userId, "Somente administradores podem regenerar convite.");
    const updatedHouse = await prisma.casa.update({ where: { id: user.casaId! }, data: { codigoConvite: randomInviteCode() }, select: { codigoConvite: true } });
    await createHouseAuditEntry({ casaId: user.casaId!, type: AUDIT_INVITE_ROTATED, description: "Codigo de convite regenerado pelo administrador.", actorResidentId: userId });
    return updatedHouse;
  },
  async upsertContribution(userId: string, input: UpsertContributionInput) {
    const user = await requireHouseMember(userId);
    await prisma.contribuicao.upsert({
      where: { moradorId_casaId_mes_ano: { moradorId: userId, casaId: user.casaId!, mes: input.mes, ano: input.ano } },
      update: { valorCentavos: input.valorCentavos, status: RECORD_CONFIRMED },
      create: { moradorId: userId, casaId: user.casaId!, valorCentavos: input.valorCentavos, mes: input.mes, ano: input.ano, status: RECORD_CONFIRMED }
    });
    await ensureCurrentCycle(user.casaId!, input.mes, input.ano);
  },
  async deleteContribution(userId: string, contributionId: string) {
    const user = await requireHouseMember(userId);
    const contribution = await prisma.contribuicao.findUnique({ where: { id: contributionId } });
    if (!contribution || contribution.casaId !== user.casaId || contribution.moradorId !== userId) throw new Error("Contribuicao nao encontrada.");
    await prisma.contribuicao.delete({ where: { id: contributionId } });
    await ensureCurrentCycle(user.casaId!, contribution.mes, contribution.ano);
  },
  async createHouseBill(userId: string, input: CreateHouseBillInput) {
    const user = await requireHouseMember(userId);
    await prisma.transacao.create({
      data: {
        casaId: user.casaId!, moradorId: userId, titulo: input.titulo, categoria: input.categoria, valorCentavos: input.valorCentavos, dataVencimento: input.vencimento, observacao: input.observacao, escopo: EscopoTransacao.CASA, tipo: TipoTransacao.DESPESA, frequencia: "UNICA", status: StatusTransacao.PENDENTE
      }
    });
    await ensureCurrentCycle(user.casaId!, input.vencimento.getMonth() + 1, input.vencimento.getFullYear());
  },
  async updateHouseBill(userId: string, billId: string, input: UpdateHouseBillInput) {
    const user = await requireHouseMember(userId);
    const current = await prisma.transacao.findUnique({ where: { id: billId } });
    if (!current || current.casaId !== user.casaId) throw new Error("Conta da casa nao encontrada.");
    await prisma.transacao.update({
      where: { id: billId },
      data: { titulo: input.titulo, categoria: input.categoria, valorCentavos: input.valorCentavos, dataVencimento: input.vencimento, observacao: input.observacao, status: input.status === STATUS_PAID ? StatusTransacao.CONCLUIDA : StatusTransacao.PENDENTE }
    });
    await ensureCurrentCycle(user.casaId!, current.dataVencimento.getMonth() + 1, current.dataVencimento.getFullYear());
    await ensureCurrentCycle(user.casaId!, input.vencimento.getMonth() + 1, input.vencimento.getFullYear());
  },
  async deleteHouseBill(userId: string, billId: string) {
    const user = await requireHouseMember(userId);
    const bill = await prisma.transacao.findUnique({ where: { id: billId } });
    if (!bill || bill.casaId !== user.casaId) throw new Error("Conta da casa nao encontrada.");
    await prisma.transacao.delete({ where: { id: billId } });
    await ensureCurrentCycle(user.casaId!, bill.dataVencimento.getMonth() + 1, bill.dataVencimento.getFullYear());
  },
  async markHouseBillAsPaid(userId: string, billId: string) {
    const user = await requireHouseMember(userId);
    const bill = await prisma.transacao.findUnique({ where: { id: billId } });
    if (!bill || bill.casaId !== user.casaId) throw new Error("Conta da casa nao encontrada.");
    await prisma.transacao.update({ where: { id: billId }, data: { status: StatusTransacao.CONCLUIDA, dataPagamento: new Date() } });
  },
  async getHouseSnapshot(userId: string): Promise<HouseSnapshot> {
    const { month, year } = getMonthYear();
    const user = await getUserWithHouse(userId);
    if (!user?.casa) throw new Error("Usuario ainda nao participa de uma casa.");
    const cycle = await ensureCurrentCycle(user.casa.id, month, year);
    const casa = user.casa!;

    const currentContributions = casa.contribuicoes.filter((item) => item.mes === month && item.ano === year);
    
    // Convert transacoes from house scope
    const contasCasa = casa.transacoes.filter(t => t.escopo === "CASA" && t.tipo === "DESPESA").map(t => ({
      ...t, vencimento: t.dataVencimento, status: t.status === "CONCLUIDA" ? STATUS_PAID : "PENDENTE", pagaEm: t.status === "CONCLUIDA" ? t.dataPagamento : null
    }));

    const currentBills = contasCasa.filter((item) => item.vencimento.getMonth() + 1 === month && item.vencimento.getFullYear() === year);

    const totalDeclaredCents = sumBy(currentContributions, (item) => item.valorCentavos);
    const totalCommittedCents = sumBy(currentBills, (item) => item.valorCentavos);
    const dueDate = currentBills.filter((item) => item.status !== STATUS_PAID).sort((a, b) => a.vencimento.getTime() - b.vencimento.getTime())[0]?.vencimento;

    return {
      monthLabel: getMonthLabel(), houseName: casa.nome, totalDeclared: toCurrencyValue(totalDeclaredCents), totalCommitted: toCurrencyValue(totalCommittedCents), freeBalance: cycle.endingBalance, cycle, healthStatus: cycle.endingBalance >= 0 ? "Equilibrado" : "Atencao", reviewDate: dueDate ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(dueDate) : "sem revisao pendente",
      contributions: casa.moradores.map((resident) => {
        const contribution = currentContributions.find((item) => item.moradorId === resident.id);
        const contributionStatus: "confirmed" | "pending" = contribution ? "confirmed" : "pending";
        return {
          id: resident.id, contributionId: contribution?.id, residentName: resident.nome, amount: toCurrencyValue(contribution?.valorCentavos ?? 0), status: contributionStatus, avatar: resident.avatarUrl || initials(resident.nome), role: roleToUi(resident.role), month, year, isCurrentUser: resident.id === userId
        };
      }).sort((a, b) => b.amount - a.amount),
      pendingBills: currentBills.filter((item) => item.status !== STATUS_PAID).sort((a, b) => a.vencimento.getTime() - b.vencimento.getTime()).map((item) => mapHouseBill(item)),
      paidBills: currentBills.filter((item) => item.status === STATUS_PAID).sort((a, b) => (b.pagaEm?.getTime() ?? 0) - (a.pagaEm?.getTime() ?? 0)).map((item) => mapHouseBill(item, true))
    };
  },
  async getHouseBills(userId: string) { return (await this.getHouseSnapshot(userId)).pendingBills; },
  async getHouseContributions(userId: string) { return (await this.getHouseSnapshot(userId)).contributions; }
};
