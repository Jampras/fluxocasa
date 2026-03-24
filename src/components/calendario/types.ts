export type CalendarScope = "geral" | "casa" | "pessoal";

export interface CalendarItem {
  id: string;
  title: string;
  amount: number;
  scope: "Casa" | "Pessoal";
  type: "Conta" | "Recebimento" | "Gasto";
  date: string;
  dateLabel: string;
  status: string;
  recurrenceLabel?: string;
  href: string;
  actionLabel: string;
}

export interface CalendarCell {
  key: string;
  dayNumber: number;
  isoDate: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  items: CalendarItem[];
}

export interface InteractiveCalendarView {
  activeScope: CalendarScope;
  monthLabel: string;
  calendarCells: CalendarCell[];
  fallbackEvents: CalendarItem[];
  spotlightDate: string;
  todayKey: string;
  todayEvents: CalendarItem[];
  pendingCount: number;
  urgentCount: number;
  incomingCount: number;
}
