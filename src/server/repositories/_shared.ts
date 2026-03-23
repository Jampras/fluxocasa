import { prisma } from "@/lib/prisma";
import { safeCache } from "@/lib/safe-cache";
import { toCurrencyValue } from "@/lib/utils";
import type { HouseAuditEvent, HouseBill, HouseCycleSummary, RecurrenceType, ResidentRole } from "@/types";

// ─── Constants ─────────────────────────────────────────────
export const ROLE_ADMIN = "ADMIN";
export const ROLE_MEMBER = "MEMBRO";
export const STATUS_PENDING = "PENDENTE";
export const STATUS_PAID = "PAGA";
export const STATUS_WARNING = "ALERTA";
export const RECORD_CONFIRMED = "CONFIRMADO";
export const AUDIT_HOUSE_CREATED = "HOUSE_CREATED";
export const AUDIT_MEMBER_JOINED = "MEMBER_JOINED";
export const AUDIT_INVITE_ROTATED = "INVITE_ROTATED";
export const AUDIT_ADMIN_TRANSFERRED = "ADMIN_TRANSFERRED";
export const AUDIT_MEMBER_REMOVED = "MEMBER_REMOVED";
export const AUDIT_MEMBER_LEFT = "MEMBER_LEFT";

// ─── Date Helpers ──────────────────────────────────────────
export function getCurrentReferenceDate() { return new Date(); }
export function getMonthYear(date = getCurrentReferenceDate()) { return { month: date.getMonth() + 1, year: date.getFullYear() }; }
export function getMonthRange(month: number, year: number) { const start = new Date(year, month - 1, 1); const end = new Date(year, month, 1); return { start, end }; }
export function getMonthLabel(date = getCurrentReferenceDate()) { return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date); }
export function formatDueLabel(date: Date, prefix: string) { return `${prefix} ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date)}`; }
export function dateInputValue(date: Date) { return date.toISOString().slice(0, 10); }
export function formatAuditDate(date: Date) { return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date); }
function startOfDay(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function daysBetween(start: Date, end: Date) {
  return Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / 86_400_000);
}

// ─── Data Helpers ──────────────────────────────────────────
export function toBillStatus(status: string, dueDate?: Date): "pending" | "paid" | "warning" {
  if (status === STATUS_PAID || status === "CONCLUIDA") return "paid";
  if (status === STATUS_WARNING) return "warning";
  if (dueDate) {
    const remainingDays = daysBetween(getCurrentReferenceDate(), dueDate);

    if (remainingDays < 0 || (remainingDays > 0 && remainingDays <= 3)) {
      return "warning";
    }
  }
  return "pending";
}
export function frequencyToUi(
  frequency: string,
  installmentCurrent?: number | null,
  installmentTotal?: number | null
): {
  recurrenceType: RecurrenceType;
  recurrenceLabel: string;
  installmentLabel?: string;
} {
  if (frequency === "PARCELADA") {
    const current = installmentCurrent ?? 1;
    const total = installmentTotal ?? current;

    return {
      recurrenceType: "installment",
      recurrenceLabel: "Parcelada",
      installmentLabel: `${current}/${total}`
    };
  }

  if (frequency === "MENSAL") {
    return {
      recurrenceType: "monthly",
      recurrenceLabel: "Mensal"
    };
  }

  if (frequency === "FIXA") {
    return {
      recurrenceType: "fixed",
      recurrenceLabel: "Fixa"
    };
  }

  return {
    recurrenceType: "single",
    recurrenceLabel: "Unica"
  };
}
export function initials(name: string) { return name.slice(0, 1).toUpperCase(); }
export function roleToUi(role: string): ResidentRole { return role === ROLE_ADMIN ? "ADMIN" : "MEMBER"; }
export function randomInviteCode() { return `FLUXO-${Math.random().toString(36).slice(2, 6).toUpperCase()}`; }
export function sumBy<T>(items: T[], getValue: (item: T) => number) { return items.reduce((total, item) => total + getValue(item), 0); }
export function mapHouseBill(
  bill: {
    id: string;
    titulo: string;
    categoria: string;
    valorCentavos: number;
    vencimento: Date;
    status: string;
    observacao: string | null;
    frequencia?: string;
    parcelaAtual?: number | null;
    parcelasTotais?: number | null;
    pagaEm?: Date | null;
  },
  paid = false
): HouseBill {
  const status = paid ? "paid" : toBillStatus(bill.status, bill.vencimento);
  const recurrence = frequencyToUi(bill.frequencia ?? "UNICA", bill.parcelaAtual, bill.parcelasTotais);

  return {
    id: bill.id,
    title: bill.titulo,
    category: bill.categoria,
    amount: toCurrencyValue(bill.valorCentavos),
    dueLabel: paid && bill.pagaEm ? formatDueLabel(bill.pagaEm, "Pago em") : formatDueLabel(bill.vencimento, "Vencimento"),
    dueDate: dateInputValue(bill.vencimento),
    status,
    note: bill.observacao ?? undefined,
    recurrenceType: recurrence.recurrenceType,
    recurrenceLabel: recurrence.recurrenceLabel,
    installmentLabel: recurrence.installmentLabel,
    installmentCurrent: bill.parcelaAtual ?? undefined,
    installmentTotal: bill.parcelasTotais ?? undefined
  };
}
export function auditTitle(type: string): HouseAuditEvent["title"] {
  switch (type) {
    case AUDIT_HOUSE_CREATED: return "Casa criada";
    case AUDIT_MEMBER_JOINED: return "Morador entrou";
    case AUDIT_INVITE_ROTATED: return "Convite atualizado";
    case AUDIT_ADMIN_TRANSFERRED: return "Administracao transferida";
    case AUDIT_MEMBER_REMOVED: return "Morador removido";
    case AUDIT_MEMBER_LEFT: return "Morador saiu";
    default: return "Atualizacao da casa";
  }
}
export function mapAuditDescription(entry: { tipo: string; descricao: string; ator: { nome: string } | null; alvo: { nome: string } | null; }) {
  const actorName = entry.ator?.nome ?? "Um morador";
  const targetName = entry.alvo?.nome ?? "um morador";
  switch (entry.tipo) {
    case AUDIT_HOUSE_CREATED: return `${actorName} criou a casa e assumiu a administracao.`;
    case AUDIT_MEMBER_JOINED: return `${targetName} entrou na casa usando o codigo de convite.`;
    case AUDIT_INVITE_ROTATED: return `${actorName} gerou um novo codigo de convite.`;
    case AUDIT_ADMIN_TRANSFERRED: return `${actorName} transferiu a administracao para ${targetName}.`;
    case AUDIT_MEMBER_REMOVED: return `${actorName} removeu ${targetName} da casa.`;
    case AUDIT_MEMBER_LEFT: return `${actorName} saiu da casa.`;
    default: return entry.descricao;
  }
}

// ─── Query Helpers ─────────────────────────────────────────
export const getUserWithHouse = safeCache(async function getUserWithHouse(userId: string) {
  return prisma.morador.findUnique({
    where: { id: userId },
    include: {
      casa: {
        include: { moradores: true, contribuicoes: true, transacoes: true, ciclosMensais: true }
      },
      transacoes: true,
      metas: true,
      contribuicoes: true
    }
  });
});
export async function requireHouseMember(userId: string) {
  const user = await prisma.morador.findUnique({ where: { id: userId } });
  if (!user?.casaId) throw new Error("Usuario ainda nao participa de uma casa.");
  return user;
}
export async function ensureUserWithoutHouse(userId: string) {
  const user = await prisma.morador.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuario nao encontrado.");
  if (user.casaId) throw new Error("Saia da casa atual antes de criar ou entrar em outra.");
  return user;
}
export async function requireHouseAdmin(userId: string, errorMessage = "Somente administradores podem gerenciar moradores.") {
  const user = await requireHouseMember(userId);
  if (user.role !== ROLE_ADMIN) throw new Error(errorMessage);
  return user;
}
export async function createHouseAuditEntry(input: { casaId: string; type: string; description: string; actorResidentId?: string; targetResidentId?: string; }) {
  await prisma.auditoriaCasa.create({
    data: {
      casaId: input.casaId, tipo: input.type, descricao: input.description, atorMoradorId: input.actorResidentId, alvoMoradorId: input.targetResidentId
    }
  });
}

export const ensureCurrentCycle = safeCache(async function ensureCurrentCycle(casaId: string, month: number, year: number): Promise<HouseCycleSummary> {
  const { start, end } = getMonthRange(month, year);
  const [historicalContributionAggregate, historicalBillAggregate, contributionAggregate, billAggregate] = await Promise.all([
    prisma.contribuicao.aggregate({ where: { casaId, OR: [ { ano: { lt: year } }, { ano: year, mes: { lt: month } } ] }, _sum: { valorCentavos: true } }),
    prisma.transacao.aggregate({ where: { casaId, escopo: "CASA", tipo: "DESPESA", dataVencimento: { lt: start } }, _sum: { valorCentavos: true } }),
    prisma.contribuicao.aggregate({ where: { casaId, mes: month, ano: year }, _sum: { valorCentavos: true } }),
    prisma.transacao.aggregate({ where: { casaId, escopo: "CASA", tipo: "DESPESA", dataVencimento: { gte: start, lt: end } }, _sum: { valorCentavos: true } })
  ]);
  const startingBalance = (historicalContributionAggregate._sum.valorCentavos ?? 0) - (historicalBillAggregate._sum.valorCentavos ?? 0);
  const netChange = (contributionAggregate._sum.valorCentavos ?? 0) - (billAggregate._sum.valorCentavos ?? 0);
  const endingBalance = startingBalance + netChange;
  await prisma.cicloMensal.upsert({
    where: { casaId_mes_ano: { casaId, mes: month, ano: year } },
    update: { saldoInicialCentavos: startingBalance, saldoFinalCentavos: endingBalance },
    create: { casaId, mes: month, ano: year, saldoInicialCentavos: startingBalance, saldoFinalCentavos: endingBalance }
  });
  await prisma.casa.update({ where: { id: casaId }, data: { saldoAcumuladoCentavos: endingBalance } });
  return { month, year, startingBalance: toCurrencyValue(startingBalance), endingBalance: toCurrencyValue(endingBalance), netChange: toCurrencyValue(netChange) };
});
