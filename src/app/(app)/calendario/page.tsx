import Link from "next/link";

import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { ScopeTabs } from "@/components/ui/ScopeTabs";
import { formatCurrency } from "@/lib/utils";
import { requireCurrentResident } from "@/server/auth/user";
import { getHouseSnapshot } from "@/server/services/house.service";
import { getPersonalSnapshot } from "@/server/services/personal.service";

type CalendarScope = "geral" | "casa" | "pessoal";

interface CalendarItem {
  id: string;
  title: string;
  amount: number;
  scope: "Casa" | "Pessoal";
  type: "Conta" | "Recebimento" | "Gasto";
  date: string;
  dateLabel: string;
  status: string;
  recurrenceLabel?: string;
  href: {
    pathname: "/dashboard";
    query: {
      tab: "casa" | "pessoal";
      focus: string;
    };
    hash: string;
  };
  actionLabel: string;
}

interface CalendarCell {
  key: string;
  dayNumber: number;
  isoDate: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  items: CalendarItem[];
}

const weekdayLabels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long"
  }).format(new Date(`${value}T12:00:00`));
}

function formatWeekdayLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    weekday: "long"
  }).format(new Date(`${value}T12:00:00`));
}

function resolveScope(scope?: string): CalendarScope {
  if (scope === "casa" || scope === "pessoal") {
    return scope;
  }

  return "geral";
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

function getCellTone(cell: CalendarCell) {
  if (cell.isToday) {
    return "bg-neo-yellow";
  }

  if (cell.items.some((item) => item.type === "Recebimento")) {
    return "bg-neo-cyan/40";
  }

  if (cell.items.some((item) => item.type !== "Recebimento")) {
    return "bg-neo-pink/20";
  }

  return "bg-white";
}

function getStatusClass(item: CalendarItem) {
  if (item.status === "Urgente") {
    return "bg-neo-pink text-white";
  }

  if (item.status === "Recebido" || item.status === "Paga" || item.status === "Registrado") {
    return "bg-neo-lime text-neo-dark";
  }

  if (item.type === "Recebimento") {
    return "bg-neo-cyan text-neo-dark";
  }

  return "bg-neo-yellow text-neo-dark";
}

function getMarkerClass(item: CalendarItem) {
  if (item.type === "Recebimento") {
    return "bg-neo-cyan";
  }

  if (item.status === "Urgente") {
    return "bg-neo-pink";
  }

  if (item.status === "Paga" || item.status === "Recebido" || item.status === "Registrado") {
    return "bg-neo-lime";
  }

  return "bg-neo-yellow";
}

export default async function CalendarioPage({
  searchParams
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const user = await requireCurrentResident();
  const resolvedParams = await searchParams;
  const activeScope = resolveScope(resolvedParams.scope);
  const shouldLoadHouse = activeScope !== "pessoal";
  const shouldLoadPersonal = activeScope !== "casa";
  const houseSnapshot = shouldLoadHouse ? await getHouseSnapshot(user.id) : null;
  const personalSnapshot = shouldLoadPersonal ? await getPersonalSnapshot(user.id) : null;
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
      href: {
        pathname: "/dashboard" as const,
        query: { tab: "casa" as const, focus: `house-bill-${bill.id}` },
        hash: `house-bill-${bill.id}`
      },
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
      href: {
        pathname: "/dashboard" as const,
        query: { tab: "casa" as const, focus: `house-bill-${bill.id}` },
        hash: `house-bill-${bill.id}`
      },
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
      href: {
        pathname: "/dashboard" as const,
        query: { tab: "pessoal" as const, focus: `personal-bill-${bill.id}` },
        hash: `personal-bill-${bill.id}`
      },
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
      href: {
        pathname: "/dashboard" as const,
        query: { tab: "pessoal" as const, focus: `income-${income.id}` },
        hash: `income-${income.id}`
      },
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
      href: {
        pathname: "/dashboard" as const,
        query: { tab: "pessoal" as const, focus: `expense-${expense.id}` },
        hash: `expense-${expense.id}`
      },
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
  const pendingCount = events.filter((item) => item.status === "Pendente" || item.status === "Urgente").length;
  const urgentCount = events.filter((item) => item.status === "Urgente").length;
  const incomingCount = events.filter((item) => item.type === "Recebimento").length;
  const dashboardHref =
    activeScope === "casa"
      ? "/dashboard?tab=casa"
      : activeScope === "pessoal"
        ? "/dashboard?tab=pessoal"
        : "/dashboard";

  return (
    <div className="space-y-6 pb-16 sm:space-y-8 sm:pb-20">
      <AppHeader monthLabel={monthLabel} title="Calendario" />

      <ScopeTabs
        currentScope={activeScope}
        tabs={[
          { id: "geral", label: "Geral", description: "Casa e pessoal" },
          { id: "casa", label: "Casa", description: "Fluxo compartilhado" },
          { id: "pessoal", label: "Pessoal", description: "Fluxo privado" }
        ]}
      />

      <Card className="bg-white p-4 sm:p-5 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-heading text-[10px] uppercase tracking-[0.18em] text-neo-pink sm:text-sm sm:tracking-[0.26em]">
                  Agenda mensal
                </p>
                <h2 className="mt-1 font-heading text-3xl uppercase text-neo-dark sm:text-4xl md:text-5xl">
                  {monthLabel}
                </h2>
              </div>
              <Link
                href={dashboardHref}
                className="inline-flex items-center justify-center border-[3px] border-neo-dark bg-neo-cyan px-4 py-3 font-heading text-lg uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1 sm:border-4"
              >
                Adicionar
              </Link>
            </div>
            <p className="font-body text-sm font-bold uppercase tracking-[0.12em] text-neo-dark/70 sm:text-base sm:tracking-wide">
              Recebimentos, contas e gastos distribuidos por data no escopo atual.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="border-[3px] border-neo-dark bg-white px-3 py-3 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:px-4 sm:py-4">
              <p className="font-heading text-[9px] uppercase tracking-[0.14em] text-neo-pink sm:text-[10px]">
                Agenda ativa
              </p>
              <p className="mt-2 font-heading text-3xl uppercase text-neo-dark sm:text-4xl">{events.length}</p>
            </div>
            <div className="border-[3px] border-neo-dark bg-white px-3 py-3 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:px-4 sm:py-4">
              <p className="font-heading text-[9px] uppercase tracking-[0.14em] text-neo-pink sm:text-[10px]">
                Pendencias
              </p>
              <p className="mt-2 font-heading text-3xl uppercase text-neo-dark sm:text-4xl">{pendingCount}</p>
            </div>
            <div className="border-[3px] border-neo-dark bg-white px-3 py-3 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:px-4 sm:py-4">
              <p className="font-heading text-[9px] uppercase tracking-[0.14em] text-neo-pink sm:text-[10px]">
                Sinais
              </p>
              <p className="mt-2 font-heading text-3xl uppercase text-neo-dark sm:text-4xl">
                {urgentCount}/{incomingCount}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-white p-3 sm:p-4 md:p-5">
        <div className="mb-3 grid grid-cols-3 gap-2 border-b-[3px] border-neo-dark pb-3 sm:mb-4 sm:border-b-4 sm:gap-3 sm:pb-4">
          <div className="flex items-center gap-2 border-[3px] border-neo-dark bg-white px-2 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-neo-dark sm:border-4 sm:px-3 sm:text-xs">
            <span className="h-3 w-3 border-2 border-neo-dark bg-neo-cyan" />
            Entradas
          </div>
          <div className="flex items-center gap-2 border-[3px] border-neo-dark bg-white px-2 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-neo-dark sm:border-4 sm:px-3 sm:text-xs">
            <span className="h-3 w-3 border-2 border-neo-dark bg-neo-pink" />
            Saidas
          </div>
          <div className="flex items-center gap-2 border-[3px] border-neo-dark bg-white px-2 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-neo-dark sm:border-4 sm:px-3 sm:text-xs">
            <span className="h-3 w-3 border-2 border-neo-dark bg-neo-yellow" />
            Hoje
          </div>
        </div>

        <div className="grid grid-cols-7 border-[3px] border-neo-dark sm:border-4">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="border-b-[3px] border-r-[3px] border-neo-dark bg-white px-1 py-2 text-center font-heading text-[10px] uppercase text-neo-dark last:border-r-0 sm:border-b-4 sm:border-r-4 sm:px-2 sm:py-3 sm:text-sm"
            >
              {label}
            </div>
          ))}

          {calendarCells.map((cell, index) => (
            <div
              key={cell.key}
              className={`relative min-h-[78px] border-r-[3px] border-b-[3px] border-neo-dark px-1.5 py-1.5 sm:min-h-[96px] sm:border-r-4 sm:border-b-4 sm:px-2 sm:py-2 ${
                index % 7 === 6 ? "border-r-0" : ""
              } ${index >= calendarCells.length - 7 ? "border-b-0" : ""} ${cell.inCurrentMonth ? getCellTone(cell) : "bg-neo-dark/5 text-neo-dark/35"}`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className={`font-heading text-lg leading-none sm:text-2xl ${cell.isToday ? "italic" : ""}`}>
                  {cell.dayNumber}
                </span>
                {cell.items.length > 0 ? (
                  <span className="hidden rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-neo-dark sm:inline">
                    {cell.items.length}
                  </span>
                ) : null}
              </div>

              {cell.items.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1 sm:mt-4">
                  {cell.items.slice(0, 3).map((item) => (
                    <span
                      key={item.id}
                      className={`h-2.5 w-2.5 border border-neo-dark sm:h-3 sm:w-3 ${getMarkerClass(item)}`}
                    />
                  ))}
                  {cell.items.length > 3 ? (
                    <span className="text-[9px] font-black uppercase tracking-[0.08em] text-neo-dark">
                      +{cell.items.length - 3}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-white p-4 sm:p-5 md:p-6">
        <div className="flex flex-col gap-4 border-b-[3px] border-neo-dark pb-4 sm:flex-row sm:items-center sm:justify-between sm:border-b-4">
          <div>
            <p className="font-heading text-[10px] uppercase tracking-[0.18em] text-neo-pink sm:text-sm sm:tracking-[0.26em]">
              {todayEvents.length > 0 ? "Eventos de hoje" : "Proximos eventos"}
            </p>
            <h2 className="mt-1 font-heading text-2xl uppercase text-neo-dark sm:text-3xl">
              {todayEvents.length > 0 ? formatWeekdayLabel(todayKey) : formatWeekdayLabel(spotlightDate)}
            </h2>
          </div>
          <Link
            href={dashboardHref}
            className="inline-flex items-center justify-center border-[3px] border-neo-dark bg-neo-yellow px-4 py-3 font-heading text-lg uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1 sm:border-4"
          >
            Adicionar
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4">
          {fallbackEvents.length === 0 ? (
            <div className="border-[3px] border-neo-dark bg-white px-4 py-5 text-sm font-bold text-neo-dark/65 sm:border-4">
              Nenhum evento neste periodo. Use o botao adicionar para registrar uma conta, recebimento ou gasto.
            </div>
          ) : (
            fallbackEvents.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 border-[3px] border-neo-dark bg-neo-bg px-3 py-3 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:px-4 sm:py-4 lg:grid-cols-[1fr_auto]"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="border-[3px] border-neo-dark bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-neo-dark sm:border-4">
                      {item.scope}
                    </span>
                    <span className="border-[3px] border-neo-dark bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-neo-dark sm:border-4">
                      {item.type}
                    </span>
                    <span className={`border-[3px] border-neo-dark px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] sm:border-4 ${getStatusClass(item)}`}>
                      {item.status}
                    </span>
                  </div>
                  <div>
                    <p className="font-heading text-2xl uppercase text-neo-dark sm:text-3xl">{item.title}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-neo-dark/65 sm:text-sm">
                      {item.dateLabel}
                      {item.recurrenceLabel ? ` - ${item.recurrenceLabel}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:items-end lg:text-right">
                  <p className="font-heading text-3xl uppercase text-neo-dark sm:text-4xl">
                    {formatCurrency(item.amount)}
                  </p>
                  <Link
                    href={item.href}
                    className="inline-flex items-center justify-center border-[3px] border-neo-dark bg-neo-yellow px-4 py-3 font-heading text-base uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1 sm:border-4 sm:text-lg"
                  >
                    {item.actionLabel}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
