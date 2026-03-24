import type { InteractiveCalendarView, CalendarCell, CalendarItem, CalendarScope } from "@/components/calendario/types";
import { getPersonalSnapshot } from "@/server/services/personal.service";
import { getHouseSnapshot } from "@/server/services/house.service";

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
  const shouldLoadHouse = activeScope !== "pessoal";
  const shouldLoadPersonal = activeScope !== "casa";
  const houseSnapshot = shouldLoadHouse ? await getHouseSnapshot(userId) : null;
  const personalSnapshot = shouldLoadPersonal ? await getPersonalSnapshot(userId) : null;
  const monthLabel =
    personalSnapshot?.monthLabel ??
    houseSnapshot?.monthLabel ??
    new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date());

  const allEvents: CalendarItem[] = [
    ...(houseSnapshot?.pendingBills.map((bill) => ({
      id: `house-pending-${bill.id}`,
      title: bill.title,
      amount: bill.amount,
      scope: "Casa" as const,
      type: "Conta" as const,
      date: bill.dueDate,
      dateLabel: bill.dueLabel,
      status: bill.status === "warning" ? "Urgente" : "Pendente",
      recurrenceLabel: bill.recurrenceLabel,
      href: `/gerenciar?tab=casa&focus=house-bill-${bill.id}#house-bill-${bill.id}`,
      actionLabel: "Editar conta"
    })) ?? []),
    ...(houseSnapshot?.paidBills.map((bill) => ({
      id: `house-paid-${bill.id}`,
      title: bill.title,
      amount: bill.amount,
      scope: "Casa" as const,
      type: "Conta" as const,
      date: bill.dueDate,
      dateLabel: bill.dueLabel,
      status: "Paga",
      recurrenceLabel: bill.recurrenceLabel,
      href: `/gerenciar?tab=casa&focus=house-bill-${bill.id}#house-bill-${bill.id}`,
      actionLabel: "Ver conta"
    })) ?? []),
    ...(personalSnapshot?.personalBills.map((bill) => ({
      id: `personal-bill-${bill.id}`,
      title: bill.title,
      amount: bill.amount,
      scope: "Pessoal" as const,
      type: "Conta" as const,
      date: bill.dueDate,
      dateLabel: bill.dueLabel,
      status: bill.status === "paid" ? "Paga" : bill.status === "warning" ? "Urgente" : "Pendente",
      recurrenceLabel: bill.recurrenceLabel,
      href: `/gerenciar?tab=pessoal&focus=personal-bill-${bill.id}#personal-bill-${bill.id}`,
      actionLabel: "Editar conta"
    })) ?? []),
    ...(personalSnapshot?.incomes.map((income) => ({
      id: `income-${income.id}`,
      title: income.title,
      amount: income.amount,
      scope: "Pessoal" as const,
      type: "Recebimento" as const,
      date: income.referenceDate,
      dateLabel: income.dateLabel,
      status: income.status === "received" ? "Recebido" : "Previsto",
      recurrenceLabel: income.recurrenceLabel,
      href: `/gerenciar?tab=pessoal&focus=income-${income.id}#income-${income.id}`,
      actionLabel: "Editar recebimento"
    })) ?? []),
    ...(personalSnapshot?.expenses.map((expense) => ({
      id: `expense-${expense.id}`,
      title: expense.title,
      amount: expense.amount,
      scope: "Pessoal" as const,
      type: "Gasto" as const,
      date: expense.expenseDate,
      dateLabel: `Lancado em ${formatDateLabel(expense.expenseDate)}`,
      status: "Registrado",
      href: `/gerenciar?tab=pessoal&focus=expense-${expense.id}#expense-${expense.id}`,
      actionLabel: "Ver gasto"
    })) ?? [])
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
