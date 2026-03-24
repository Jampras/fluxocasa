import type { InteractiveCalendarView, CalendarCell, CalendarItem, CalendarScope } from "@/components/calendario/types";
import { prisma } from "@/lib/prisma";
import { EscopoTransacao, StatusTransacao, TipoTransacao } from "@prisma/client";
import { dateInputValue, getMonthLabel, getMonthRange, getMonthYear } from "@/server/repositories/_shared";
import { ensureHouseRecurringTransactions, ensurePersonalRecurringTransactions } from "@/server/repositories/_recurrence";

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long"
  }).format(new Date(`${value}T12:00:00`));
}

function toLocalIso(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveReferenceMonth(events: CalendarItem[]) {
  if (events.length > 0) {
    return new Date(`${events[0].date}T12:00:00`);
  }

  return new Date();
}

function buildCalendarCells(referenceDate: Date, grouped: Map<string, CalendarItem[]>) {
  const firstDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1, 12);
  const lastDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 12);
  const daysInMonth = lastDay.getDate();
  const leadingDays = firstDay.getDay();
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - leadingDays);

  return Array.from({ length: totalCells }, (_, index) => {
    const cellDate = new Date(startDate);
    cellDate.setDate(startDate.getDate() + index);
    const isoDate = toLocalIso(cellDate);

    return {
      key: isoDate,
      dayNumber: cellDate.getDate(),
      isoDate,
      inCurrentMonth: cellDate.getMonth() === referenceDate.getMonth(),
      isToday: isoDate === toLocalIso(new Date()),
      items: grouped.get(isoDate) ?? []
    } satisfies CalendarCell;
  });
}

export async function getInteractiveCalendarView(
  userId: string,
  activeScope: CalendarScope = "geral"
): Promise<InteractiveCalendarView> {
  const { month, year } = getMonthYear();
  const { start, end } = getMonthRange(month, year);
  const resident = await prisma.morador.findUnique({
    where: { id: userId },
    select: { casaId: true }
  });
  if (!resident) {
    throw new Error("Usuario nao encontrado.");
  }

  const shouldLoadHouse = activeScope !== "pessoal";
  const shouldLoadPersonal = activeScope !== "casa";

  await Promise.all([
    shouldLoadHouse && resident.casaId ? ensureHouseRecurringTransactions(resident.casaId) : Promise.resolve(),
    shouldLoadPersonal ? ensurePersonalRecurringTransactions(userId) : Promise.resolve()
  ]);

  const [houseBills, personalTransactions] = await Promise.all([
    shouldLoadHouse && resident.casaId
      ? prisma.transacao.findMany({
          where: {
            casaId: resident.casaId,
            escopo: EscopoTransacao.CASA,
            tipo: TipoTransacao.DESPESA,
            dataVencimento: { gte: start, lt: end }
          },
          orderBy: { dataVencimento: "asc" },
          select: {
            id: true,
            titulo: true,
            categoria: true,
            valorCentavos: true,
            status: true,
            dataVencimento: true,
            dataPagamento: true,
            frequencia: true,
            parcelaAtual: true,
            parcelasTotais: true
          }
        })
      : Promise.resolve([]),
    shouldLoadPersonal
      ? prisma.transacao.findMany({
          where: {
            moradorId: userId,
            escopo: EscopoTransacao.PESSOAL,
            dataVencimento: { gte: start, lt: end }
          },
          orderBy: { dataVencimento: "asc" },
          select: {
            id: true,
            titulo: true,
            categoria: true,
            valorCentavos: true,
            status: true,
            tipo: true,
            dataVencimento: true,
            dataPagamento: true,
            frequencia: true,
            parcelaAtual: true,
            parcelasTotais: true
          }
        })
      : Promise.resolve([])
  ]);

  const monthLabel = getMonthLabel();

  const allEvents: CalendarItem[] = [
    ...houseBills.map((bill) => ({
      id: `house-${bill.id}`,
      title: bill.titulo,
      amount: bill.valorCentavos / 100,
      scope: "Casa" as const,
      type: "Conta" as const,
      date: dateInputValue(bill.dataVencimento),
      dateLabel:
        bill.status === StatusTransacao.CONCLUIDA && bill.dataPagamento
          ? formatDateLabel(dateInputValue(bill.dataPagamento)).replace(/^/, "Pago em ")
          : `Vence em ${formatDateLabel(dateInputValue(bill.dataVencimento))}`,
      status:
        bill.status === StatusTransacao.CONCLUIDA
          ? "Paga"
          : new Date(bill.dataVencimento).getTime() < Date.now()
            ? "Urgente"
            : "Pendente",
      recurrenceLabel:
        bill.frequencia === "MENSAL"
          ? "Mensal"
          : bill.frequencia === "FIXA"
            ? "Fixa"
            : bill.frequencia === "PARCELADA"
              ? "Parcelada"
              : "Unica",
      href: `/gerenciar?tab=casa&focus=house-bill-${bill.id}#house-bill-${bill.id}`,
      actionLabel: bill.status === StatusTransacao.CONCLUIDA ? "Ver conta" : "Editar conta"
    })),
    ...personalTransactions.map((transaction) => {
      const isoDate = dateInputValue(transaction.dataPagamento ?? transaction.dataVencimento);
      const recurrenceLabel =
        transaction.frequencia === "MENSAL"
          ? "Mensal"
          : transaction.frequencia === "FIXA"
            ? "Fixa"
            : transaction.frequencia === "PARCELADA"
              ? "Parcelada"
              : "Unica";

      if (transaction.tipo === TipoTransacao.RECEITA) {
        const received = transaction.status === StatusTransacao.CONCLUIDA;
        return {
          id: `income-${transaction.id}`,
          title: transaction.titulo,
          amount: transaction.valorCentavos / 100,
          scope: "Pessoal" as const,
          type: "Recebimento" as const,
          date: isoDate,
          dateLabel: `${received ? "Recebido em" : "Previsto em"} ${formatDateLabel(isoDate)}`,
          status: received ? "Recebido" : "Previsto",
          recurrenceLabel,
          href: `/gerenciar?tab=pessoal&focus=income-${transaction.id}#income-${transaction.id}`,
          actionLabel: "Editar recebimento"
        } satisfies CalendarItem;
      }

      if (transaction.status === StatusTransacao.PENDENTE) {
        const dueIso = dateInputValue(transaction.dataVencimento);
        const remaining = Math.round((new Date(dueIso).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000);

        return {
          id: `personal-bill-${transaction.id}`,
          title: transaction.titulo,
          amount: transaction.valorCentavos / 100,
          scope: "Pessoal" as const,
          type: "Conta" as const,
          date: dueIso,
          dateLabel: `Vence em ${formatDateLabel(dueIso)}`,
          status: remaining < 0 || (remaining > 0 && remaining <= 3) ? "Urgente" : "Pendente",
          recurrenceLabel,
          href: `/gerenciar?tab=pessoal&focus=personal-bill-${transaction.id}#personal-bill-${transaction.id}`,
          actionLabel: "Editar conta"
        } satisfies CalendarItem;
      }

      return {
        id: `expense-${transaction.id}`,
        title: transaction.titulo,
        amount: transaction.valorCentavos / 100,
        scope: "Pessoal" as const,
        type: "Gasto" as const,
        date: isoDate,
        dateLabel: `Lancado em ${formatDateLabel(isoDate)}`,
        status: "Registrado",
        recurrenceLabel,
        href: `/gerenciar?tab=pessoal&focus=expense-${transaction.id}#expense-${transaction.id}`,
        actionLabel: "Ver gasto"
      } satisfies CalendarItem;
    })
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const events = allEvents.filter((item) => {
    if (activeScope === "geral") return true;
    if (activeScope === "casa") return item.scope === "Casa";
    return item.scope === "Pessoal";
  });

  const grouped = new Map<string, CalendarItem[]>();

  events.forEach((event) => {
    const current = grouped.get(event.date) ?? [];
    current.push(event);
    grouped.set(event.date, current);
  });

  const referenceDate = resolveReferenceMonth(events);
  const calendarCells = buildCalendarCells(referenceDate, grouped);
  const todayKey = toLocalIso(new Date());
  const todayEvents = grouped.get(todayKey) ?? [];
  const fallbackEvents = todayEvents.length ? todayEvents : events.slice(0, 3);
  const spotlightDate = todayEvents.length > 0 ? todayKey : events[0]?.date ?? todayKey;

  return {
    activeScope,
    monthLabel,
    calendarCells,
    fallbackEvents,
    spotlightDate,
    todayKey,
    todayEvents,
    pendingCount: events.filter((item) => item.status === "Pendente" || item.status === "Urgente").length,
    urgentCount: events.filter((item) => item.status === "Urgente").length,
    incomingCount: events.filter((item) => item.type === "Recebimento").length
  };
}
