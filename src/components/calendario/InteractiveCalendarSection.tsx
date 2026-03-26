import type { Route } from "next";
import Link from "next/link";

import { CalendarGridModal } from "@/components/calendario/CalendarGridModal";
import type { InteractiveCalendarView } from "@/components/calendario/types";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

function formatWeekdayLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    weekday: "long"
  }).format(new Date(`${value}T12:00:00`));
}

function getStatusClass(status: string, type: string) {
  if (status === "Urgente") {
    return "bg-neo-pink text-white";
  }

  if (status === "Recebido" || status === "Paga" || status === "Registrado") {
    return "bg-neo-lime text-neo-dark";
  }

  if (type === "Recebimento") {
    return "bg-neo-cyan text-neo-dark";
  }

  return "bg-neo-yellow text-neo-dark";
}

export function InteractiveCalendarSection({
  view,
  actionHref,
  title = "Calendario interativo",
  description,
  actionLabel = "Gerenciar"
}: {
  view: InteractiveCalendarView;
  actionHref: Route;
  title?: string;
  description?: string | null;
  actionLabel?: string;
}) {
  const { monthLabel, pendingCount, urgentCount, incomingCount, calendarCells, fallbackEvents, todayEvents, todayKey, spotlightDate, activeScope } = view;

  return (
    <section className="space-y-4 sm:space-y-5">
      <Card className="bg-neo-cream p-4 sm:p-5 md:p-6 xl:p-8">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(420px,0.7fr)] xl:items-stretch xl:gap-6">
          <div className="space-y-3 xl:flex xl:flex-col xl:justify-between">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-heading text-[10px] uppercase tracking-[0.18em] text-neo-pink sm:text-sm sm:tracking-[0.26em]">
                  {title}
                </p>
                <h2 className="mt-1 font-heading text-3xl uppercase text-neo-dark sm:text-4xl md:text-5xl">
                  {monthLabel}
                </h2>
              </div>
              <Link
                href={actionHref}
                className="neo-pressable inline-flex items-center justify-center border-[3px] border-neo-dark bg-neo-cyan px-4 py-3 font-heading text-lg uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] sm:border-4"
              >
                {actionLabel}
              </Link>
            </div>
            {description ? (
              <p className="font-body text-sm font-bold uppercase tracking-[0.12em] text-neo-dark/70 sm:text-base sm:tracking-wide">
                {description}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-3 xl:h-full">
            <div className="border-[3px] border-neo-dark bg-neo-cream px-3 py-3 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:px-4 sm:py-4 xl:flex xl:flex-col xl:justify-between xl:px-5 xl:py-5">
              <p className="font-heading text-[9px] uppercase tracking-[0.14em] text-neo-pink sm:text-[10px]">
                Agenda ativa
              </p>
              <p className="mt-2 font-heading text-3xl uppercase text-neo-dark sm:text-4xl">
                {view.calendarCells.reduce((sum, cell) => sum + cell.items.length, 0)}
              </p>
            </div>
            <div className="border-[3px] border-neo-dark bg-neo-cream px-3 py-3 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:px-4 sm:py-4 xl:flex xl:flex-col xl:justify-between xl:px-5 xl:py-5">
              <p className="font-heading text-[9px] uppercase tracking-[0.14em] text-neo-pink sm:text-[10px]">
                Pendencias
              </p>
              <p className="mt-2 font-heading text-3xl uppercase text-neo-dark sm:text-4xl">{pendingCount}</p>
            </div>
            <div className="border-[3px] border-neo-dark bg-neo-cream px-3 py-3 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:px-4 sm:py-4 xl:flex xl:flex-col xl:justify-between xl:px-5 xl:py-5">
              <p className="font-heading text-[9px] uppercase tracking-[0.14em] text-neo-pink sm:text-[10px]">
                Alertas
              </p>
              <p className="mt-2 font-heading text-3xl uppercase text-neo-dark sm:text-4xl">
                {urgentCount}/{incomingCount}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-neo-cream p-3 sm:p-4 md:p-5 xl:p-7">
        <div className="mb-3 grid grid-cols-3 gap-2 border-b-[3px] border-neo-dark pb-3 sm:mb-4 sm:border-b-4 sm:gap-3 sm:pb-4">
          <div className="flex items-center gap-2 border-[3px] border-neo-dark bg-neo-cream px-2 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-neo-dark sm:border-4 sm:px-3 sm:text-xs">
            <span className="h-3 w-3 border-2 border-neo-dark bg-neo-cyan" />
            Entradas
          </div>
          <div className="flex items-center gap-2 border-[3px] border-neo-dark bg-neo-cream px-2 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-neo-dark sm:border-4 sm:px-3 sm:text-xs">
            <span className="h-3 w-3 border-2 border-neo-dark bg-neo-pink" />
            Saidas
          </div>
          <div className="flex items-center gap-2 border-[3px] border-neo-dark bg-neo-cream px-2 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-neo-dark sm:border-4 sm:px-3 sm:text-xs">
            <span className="h-3 w-3 border-2 border-neo-dark bg-neo-yellow" />
            Hoje
          </div>
        </div>

        <CalendarGridModal activeScope={activeScope} calendarCells={calendarCells} />
      </Card>

      <Card className="bg-neo-cream p-4 sm:p-5 md:p-6 xl:p-8">
        <div className="flex flex-col gap-4 border-b-[3px] border-neo-dark pb-4 sm:flex-row sm:items-center sm:justify-between sm:border-b-4 xl:pb-5">
          <div className="xl:max-w-3xl">
            <p className="font-heading text-[10px] uppercase tracking-[0.18em] text-neo-pink sm:text-sm sm:tracking-[0.26em]">
              {todayEvents.length > 0 ? "Eventos de hoje" : "Proximos eventos"}
            </p>
            <h2 className="mt-1 font-heading text-2xl uppercase text-neo-dark sm:text-3xl">
              {todayEvents.length > 0 ? formatWeekdayLabel(todayKey) : formatWeekdayLabel(spotlightDate)}
            </h2>
          </div>
          <Link
            href={actionHref}
            className="neo-pressable inline-flex items-center justify-center border-[3px] border-neo-dark bg-neo-yellow px-4 py-3 font-heading text-lg uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] sm:border-4"
          >
            {actionLabel}
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 xl:grid-cols-2">
          {fallbackEvents.length === 0 ? (
            <div className="border-[3px] border-neo-dark bg-neo-cream px-4 py-5 text-sm font-bold text-neo-dark/65 sm:border-4">
              Nenhum evento neste periodo.
            </div>
          ) : (
            fallbackEvents.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 border-[3px] border-neo-dark bg-neo-bg px-3 py-3 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:px-4 sm:py-4 lg:grid-cols-[1fr_auto]"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="border-[3px] border-neo-dark bg-neo-cream px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-neo-dark sm:border-4">
                      {item.scope}
                    </span>
                    <span className="border-[3px] border-neo-dark bg-neo-cream px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-neo-dark sm:border-4">
                      {item.type}
                    </span>
                    <span className={`border-[3px] border-neo-dark px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] sm:border-4 ${getStatusClass(item.status, item.type)}`}>
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
                  <a
                    href={item.href}
                    className="neo-pressable inline-flex items-center justify-center border-[3px] border-neo-dark bg-neo-yellow px-4 py-3 font-heading text-base uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] sm:border-4 sm:text-lg"
                  >
                    {item.actionLabel}
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </section>
  );
}
