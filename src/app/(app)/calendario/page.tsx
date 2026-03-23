import Link from "next/link";

import { AppHeader } from "@/components/layout/AppHeader";
import { ScopeTabs } from "@/components/ui/ScopeTabs";
import { Card } from "@/components/ui/Card";
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

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long"
  }).format(new Date(`${value}T12:00:00`));
}

function resolveScope(scope?: string): CalendarScope {
  if (scope === "casa" || scope === "pessoal") {
    return scope;
  }

  return "geral";
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
    const key = event.date;
    const current = grouped.get(key) ?? [];
    current.push(event);
    grouped.set(key, current);
  });

  const pendingCount = events.filter((item) => item.status === "Pendente" || item.status === "Urgente").length;
  const urgentCount = events.filter((item) => item.status === "Urgente").length;
  const incomingCount = events.filter((item) => item.type === "Recebimento").length;

  return (
    <div className="space-y-8 pb-20">
      <AppHeader monthLabel={monthLabel} title="Calendario" />

      <ScopeTabs
        currentScope={activeScope}
        tabs={[
          { id: "geral", label: "Geral", description: "Casa e pessoal" },
          { id: "casa", label: "Casa", description: "Fluxo compartilhado" },
          { id: "pessoal", label: "Pessoal", description: "Fluxo privado" }
        ]}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white p-6">
          <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">Agenda ativa</p>
          <h2 className="mt-3 font-heading text-5xl uppercase text-neo-dark">{events.length}</h2>
          <p className="mt-2 font-body text-sm font-bold uppercase tracking-wide text-neo-dark/65">
            Eventos visiveis no escopo atual.
          </p>
        </Card>
        <Card className="bg-white p-6">
          <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">Pendencias</p>
          <h2 className="mt-3 font-heading text-5xl uppercase text-neo-dark">{pendingCount}</h2>
          <p className="mt-2 font-body text-sm font-bold uppercase tracking-wide text-neo-dark/65">
            Contas aguardando acao no mes.
          </p>
        </Card>
        <Card className="bg-white p-6">
          <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">Sinais do periodo</p>
          <h2 className="mt-3 font-heading text-5xl uppercase text-neo-dark">
            {urgentCount}/{incomingCount}
          </h2>
          <p className="mt-2 font-body text-sm font-bold uppercase tracking-wide text-neo-dark/65">
            Urgentes versus recebimentos previstos.
          </p>
        </Card>
      </div>

      <Card className="bg-white p-6">
        <div className="space-y-2">
          <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">
            Agenda financeira
          </p>
          <h2 className="font-heading text-4xl uppercase text-neo-dark">
            Contas, recebimentos e movimentos por data
          </h2>
          <p className="font-body text-sm font-bold uppercase tracking-wide text-neo-dark/70">
            Cada linha leva direto para a area de edicao da casa ou do pessoal.
          </p>
        </div>
      </Card>

      <div className="grid gap-6">
        {Array.from(grouped.entries()).map(([date, items]) => (
          <Card key={date} className="bg-white p-6">
            <div className="mb-5 flex items-center justify-between gap-4 border-b-4 border-neo-dark pb-4">
              <h3 className="font-heading text-3xl uppercase text-neo-dark">
                {formatDateLabel(date)}
              </h3>
              <span className="font-body text-xs font-black uppercase tracking-[0.2em] text-neo-pink">
                {items.length} item(ns)
              </span>
            </div>
            <div className="grid gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 border-4 border-neo-dark bg-neo-bg px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="font-heading text-2xl uppercase text-neo-dark">{item.title}</p>
                    <p className="font-body text-xs font-black uppercase tracking-[0.18em] text-neo-dark/60">
                      {item.scope} - {item.type}
                      {item.recurrenceLabel ? ` - ${item.recurrenceLabel}` : ""}
                    </p>
                    <p className="mt-2 font-body text-sm font-bold text-neo-dark/70">{item.dateLabel}</p>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="font-heading text-3xl uppercase text-neo-dark">
                      {formatCurrency(item.amount)}
                    </p>
                    <p className="font-body text-xs font-black uppercase tracking-[0.18em] text-neo-pink">
                      {item.status}
                    </p>
                    <div className="mt-3">
                      <Link
                        href={item.href}
                        className="inline-flex items-center justify-center border-4 border-neo-dark bg-neo-yellow px-4 py-3 font-heading text-lg uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1"
                      >
                        {item.actionLabel}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
