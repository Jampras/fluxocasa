"use client";

import type { FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { refreshCurrentView } from "@/lib/app-refresh";
import { requestJson } from "@/lib/client-api";
import { ManageListFilters } from "@/components/gerenciar/ManageListFilters";
import type { BudgetGoal, ExpenseRecord, IncomeRecord, PersonalBillRecord } from "@/types";
import { ActionFeedback } from "@/components/ui/ActionFeedback";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { MarkIncomeReceivedButton } from "@/components/forms/MarkIncomeReceivedButton";
import { MarkPersonalBillPaidButton } from "@/components/forms/MarkPersonalBillPaidButton";
import { RecurrenceFields } from "@/components/forms/RecurrenceFields";

const now = new Date();

function uiStatusToApi(status: PersonalBillRecord["status"]) {
  return status === "paid" ? "PAGA" : "PENDENTE";
}

function uiRecurrenceToApi(
  recurrenceType: IncomeRecord["recurrenceType"] | PersonalBillRecord["recurrenceType"]
) {
  if (recurrenceType === "monthly") return "MENSAL";
  if (recurrenceType === "installment") return "PARCELADA";
  if (recurrenceType === "fixed") return "FIXA";
  return "UNICA";
}

function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short"
  }).format(new Date(`${value}T12:00:00`));
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function compareText(a: string, b: string) {
  return a.localeCompare(b, "pt-BR");
}

function buildRecurrenceSnapshot(
  frequency: string,
  installmentTotal?: number,
  installmentCurrent?: number
) {
  if (frequency === "MENSAL") {
    return {
      recurrenceType: "monthly" as const,
      recurrenceLabel: "Mensal",
      installmentLabel: undefined,
      installmentCurrent: undefined,
      installmentTotal: undefined
    };
  }

  if (frequency === "FIXA") {
    return {
      recurrenceType: "fixed" as const,
      recurrenceLabel: "Fixa",
      installmentLabel: undefined,
      installmentCurrent: undefined,
      installmentTotal: undefined
    };
  }

  if (frequency === "PARCELADA") {
    const total = installmentTotal && installmentTotal > 0 ? installmentTotal : installmentCurrent ?? 1;
    const current = installmentCurrent ?? 1;

    return {
      recurrenceType: "installment" as const,
      recurrenceLabel: "Parcelada",
      installmentLabel: `${current}/${total}`,
      installmentCurrent: current,
      installmentTotal: total
    };
  }

  return {
    recurrenceType: "single" as const,
    recurrenceLabel: "Unica",
    installmentLabel: undefined,
    installmentCurrent: undefined,
    installmentTotal: undefined
  };
}

function formatDueLabelFromDate(value: string, prefix: string) {
  return `${prefix} ${new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long"
  }).format(new Date(`${value}T12:00:00`))}`;
}

function resolveBillStatus(dueDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T12:00:00`);
  const remaining = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  return remaining < 0 || (remaining > 0 && remaining <= 3) ? "warning" : "pending";
}

interface PersonalActionsProps {
  incomes: IncomeRecord[];
  personalBills: PersonalBillRecord[];
  expenses: ExpenseRecord[];
  goals: BudgetGoal[];
}

export function PersonalActions({
  incomes,
  personalBills,
  expenses,
  goals
}: PersonalActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [incomeQuery, setIncomeQuery] = useState("");
  const [incomeStatusFilter, setIncomeStatusFilter] = useState("all");
  const [incomeSort, setIncomeSort] = useState("date-desc");
  const [billQuery, setBillQuery] = useState("");
  const [billStatusFilter, setBillStatusFilter] = useState("all");
  const [billSort, setBillSort] = useState("due-asc");
  const [expenseQuery, setExpenseQuery] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("all");
  const [expenseSort, setExpenseSort] = useState("date-desc");
  const [incomeItems, setIncomeItems] = useState(incomes);
  const [personalBillItems, setPersonalBillItems] = useState(personalBills);
  const [expenseItems, setExpenseItems] = useState(expenses);
  const [goalItems, setGoalItems] = useState(goals);
  const focusedItemId = searchParams.get("focus");
  const normalizedIncomeQuery = normalizeSearch(incomeQuery);
  const normalizedBillQuery = normalizeSearch(billQuery);
  const normalizedExpenseQuery = normalizeSearch(expenseQuery);
  const expenseCategories = Array.from(new Set(expenseItems.map((expense) => expense.category))).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  const filteredIncomes = incomeItems
    .filter((income) => {
      const matchesQuery =
        normalizedIncomeQuery.length === 0 ||
        income.title.toLowerCase().includes(normalizedIncomeQuery) ||
        income.categoryLabel.toLowerCase().includes(normalizedIncomeQuery);
      const matchesStatus =
        incomeStatusFilter === "all" ||
        (incomeStatusFilter === "received" && income.status === "received") ||
        (incomeStatusFilter === "scheduled" && income.status === "scheduled");

      return matchesQuery && matchesStatus;
    })
    .sort((left, right) => {
      if (incomeSort === "status") {
        return compareText(left.statusLabel, right.statusLabel) || compareText(left.title, right.title);
      }

      if (incomeSort === "category") {
        return compareText(left.categoryLabel, right.categoryLabel) || compareText(left.title, right.title);
      }

      const leftDate = new Date(`${left.referenceDate}T12:00:00`).getTime();
      const rightDate = new Date(`${right.referenceDate}T12:00:00`).getTime();

      return incomeSort === "date-asc" ? leftDate - rightDate : rightDate - leftDate;
    });

  const filteredPersonalBills = personalBillItems
    .filter((bill) => {
      const matchesQuery =
        normalizedBillQuery.length === 0 ||
        bill.title.toLowerCase().includes(normalizedBillQuery) ||
        bill.category.toLowerCase().includes(normalizedBillQuery);
      const matchesStatus =
        billStatusFilter === "all" ||
        (billStatusFilter === "warning" && bill.status === "warning") ||
        (billStatusFilter === "pending" && bill.status === "pending") ||
        (billStatusFilter === "paid" && bill.status === "paid");

      return matchesQuery && matchesStatus;
    })
    .sort((left, right) => {
      if (billSort === "status") {
        return compareText(left.status, right.status) || compareText(left.title, right.title);
      }

      if (billSort === "category") {
        return compareText(left.category, right.category) || compareText(left.title, right.title);
      }

      const leftDate = new Date(`${left.dueDate}T12:00:00`).getTime();
      const rightDate = new Date(`${right.dueDate}T12:00:00`).getTime();

      return billSort === "due-desc" ? rightDate - leftDate : leftDate - rightDate;
    });

  const filteredExpenses = expenseItems
    .filter((expense) => {
      const matchesQuery =
        normalizedExpenseQuery.length === 0 ||
        expense.title.toLowerCase().includes(normalizedExpenseQuery) ||
        expense.category.toLowerCase().includes(normalizedExpenseQuery);
      const matchesCategory =
        expenseCategoryFilter === "all" || expense.category === expenseCategoryFilter;

      return matchesQuery && matchesCategory;
    })
    .sort((left, right) => {
      if (expenseSort === "category") {
        return compareText(left.category, right.category) || compareText(left.title, right.title);
      }

      if (expenseSort === "amount-desc") {
        return right.amount - left.amount;
      }

      const leftDate = new Date(`${left.expenseDate}T12:00:00`).getTime();
      const rightDate = new Date(`${right.expenseDate}T12:00:00`).getTime();

      return expenseSort === "date-asc" ? leftDate - rightDate : rightDate - leftDate;
    });

  function isFocused(targetId: string) {
    return focusedItemId === targetId;
  }

  useEffect(() => {
    if (!error && !feedback) {
      return;
    }

    const handle = window.setTimeout(() => {
      setError(null);
      setFeedback(null);
    }, 3200);

    return () => window.clearTimeout(handle);
  }, [error, feedback]);

  useEffect(() => {
    setIncomeItems(incomes);
  }, [incomes]);

  useEffect(() => {
    setPersonalBillItems(personalBills);
  }, [personalBills]);

  useEffect(() => {
    setExpenseItems(expenses);
  }, [expenses]);

  useEffect(() => {
    setGoalItems(goals);
  }, [goals]);

  async function submit(url: string, method: string, payload?: Record<string, unknown>) {
    await requestJson(url, {
      method,
      body: JSON.stringify(payload ?? {})
    });
  }

  async function runAction(
    action: string,
    callback: () => Promise<void>,
    fallback: string,
    successMessage = "Operacao concluida.",
    options?: {
      clearFocus?: boolean;
      refreshDelayMs?: number;
      skipRefresh?: boolean;
      onSuccess?: () => void;
    }
  ) {
    setLoadingAction(action);
    setError(null);
    setFeedback(null);

    try {
      await callback();
      options?.onSuccess?.();
      setFeedback(successMessage);

      if (!options?.skipRefresh) {
        refreshCurrentView(router, pathname, searchParams, {
          clearFocus: options?.clearFocus ?? action.includes("delete"),
          delayMs: options?.refreshDelayMs
        });
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : fallback);
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="grid gap-6">
      {feedback ? <ActionFeedback tone="success" message={feedback} /> : null}
      {error ? <ActionFeedback tone="error" message={error} /> : null}

      <Card id="personal-create-income" className="bg-neo-bg">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-neo-dark">Registrar renda</h3>
          <form
            className="grid gap-4"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              void runAction(
                "income",
                () =>
                  submit("/api/pessoal/renda", "POST", {
                    titulo: formData.get("tituloRenda"),
                    categoria: formData.get("categoriaRenda"),
                    valor: formData.get("valorRenda"),
                    recebidaEm: formData.get("recebidaEm"),
                    status: formData.get("statusRenda"),
                    frequencia: formData.get("frequencia"),
                    parcelasTotais: formData.get("parcelasTotais")
                  }),
                "Nao foi possivel salvar a renda.",
                "Renda salva com sucesso."
              );
            }}
          >
            <Input id="tituloRenda" name="tituloRenda" label="Titulo" placeholder="Salario" />
            <label className="grid gap-2 text-sm font-medium text-neo-dark/75" htmlFor="categoriaRenda">
              <span>Tipo da renda</span>
              <select
                id="categoriaRenda"
                name="categoriaRenda"
                defaultValue="SALARIO"
                  className="neo-input-surface h-12 rounded-none border-4 border-neo-dark px-4 text-sm text-neo-dark"
              >
                <option value="SALARIO">Salario</option>
                <option value="EXTRA">Renda extra</option>
              </select>
            </label>
            <Input id="valorRenda" name="valorRenda" label="Valor" type="number" step="0.01" />
            <Input id="recebidaEm" name="recebidaEm" label="Data prevista" type="date" />
            <label className="grid gap-2 text-sm font-medium text-neo-dark/75" htmlFor="statusRenda">
              <span>Status</span>
              <select
                id="statusRenda"
                name="statusRenda"
                defaultValue="PREVISTO"
                  className="neo-input-surface h-12 rounded-none border-4 border-neo-dark px-4 text-sm text-neo-dark"
              >
                <option value="PREVISTO">Previsto</option>
                <option value="RECEBIDO">Recebido</option>
              </select>
            </label>
            <RecurrenceFields installmentsLabel="Parcelas da renda" />
            <Button fullWidth disabled={loadingAction === "income"}>
              {loadingAction === "income" ? "Salvando..." : "Salvar renda"}
            </Button>
          </form>
        </div>
      </Card>

      <Card id="personal-create-bill" className="bg-neo-bg border-4 border-neo-dark ">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-neo-dark">Adicionar conta pessoal</h3>
          <form
            className="grid gap-4"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              void runAction(
                "bill",
                () =>
                  submit("/api/pessoal/contas", "POST", {
                    titulo: formData.get("tituloConta"),
                    categoria: formData.get("categoriaConta"),
                    valor: formData.get("valorConta"),
                    vencimento: formData.get("vencimentoConta"),
                    observacao: formData.get("observacaoConta"),
                    frequencia: formData.get("frequencia"),
                    parcelasTotais: formData.get("parcelasTotais")
                  }),
                "Nao foi possivel salvar a conta.",
                "Conta pessoal salva com sucesso."
              );
            }}
          >
            <Input id="tituloConta" name="tituloConta" label="Titulo" placeholder="Cartao de credito" />
            <Input id="categoriaConta" name="categoriaConta" label="Categoria" placeholder="Financeiro" />
            <Input id="valorConta" name="valorConta" label="Valor" type="number" step="0.01" />
            <Input id="vencimentoConta" name="vencimentoConta" label="Vencimento" type="date" />
            <Input id="observacaoConta" name="observacaoConta" label="Observacao" placeholder="Opcional" />
            <RecurrenceFields installmentsLabel="Parcelas da conta" />
            <Button fullWidth disabled={loadingAction === "bill"}>
              {loadingAction === "bill" ? "Salvando..." : "Salvar conta"}
            </Button>
          </form>
        </div>
      </Card>

      <Card id="personal-create-expense" className="bg-neo-bg">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-neo-dark">Registrar gasto</h3>
          <form
            className="grid gap-4"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              void runAction(
                "expense",
                () =>
                  submit("/api/pessoal/gastos", "POST", {
                    titulo: formData.get("tituloGasto"),
                    categoria: formData.get("categoriaGasto"),
                    valor: formData.get("valorGasto"),
                    gastoEm: formData.get("gastoEm")
                  }),
                "Nao foi possivel salvar o gasto.",
                "Gasto salvo com sucesso."
              );
            }}
          >
            <Input id="tituloGasto" name="tituloGasto" label="Titulo" placeholder="Mercado" />
            <Input id="categoriaGasto" name="categoriaGasto" label="Categoria" placeholder="Alimentacao" />
            <Input id="valorGasto" name="valorGasto" label="Valor" type="number" step="0.01" />
            <Input id="gastoEm" name="gastoEm" label="Data" type="date" />
            <Button disabled={loadingAction === "expense"} className="bg-neo-bg text-neo-dark hover:bg-neo-bg hover:bg-stone-700 hover:translate-x-1 hover:translate-y-1 h-14 rounded-none text-lg font-semibold mt-2 ">
              {loadingAction === "expense" ? "Salvando..." : "+ Adicionar gasto"}
            </Button>
          </form>
        </div>
      </Card>

      <Card id="personal-create-goal" className="bg-neo-bg border-4 border-neo-dark ">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-neo-dark">Definir meta de categoria</h3>
          <form
            className="grid gap-4"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              void runAction(
                "goal",
                () =>
                  submit("/api/pessoal/metas", "POST", {
                    categoria: formData.get("categoriaMeta"),
                    valorMeta: formData.get("valorMeta"),
                    mes: now.getMonth() + 1,
                    ano: now.getFullYear()
                  }),
                "Nao foi possivel salvar a meta.",
                "Meta salva com sucesso."
              );
            }}
          >
            <Input id="categoriaMeta" name="categoriaMeta" label="Categoria" placeholder="Alimentacao" />
            <Input id="valorMeta" name="valorMeta" label="Limite mensal" type="number" step="0.01" />
            <Button fullWidth disabled={loadingAction === "goal"}>
              {loadingAction === "goal" ? "Salvando..." : "Salvar meta"}
            </Button>
          </form>
        </div>
      </Card>

      <Card id="personal-manage-income" className="bg-neo-bg">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-neo-dark">Gerenciar renda</h3>
          {incomeItems.length > 0 ? (
            <ManageListFilters
              searchId="income-search"
              searchLabel="Buscar renda"
              searchValue={incomeQuery}
              searchPlaceholder="Titulo ou tipo"
              onSearchChange={setIncomeQuery}
              filterId="income-status-filter"
              filterLabel="Status"
              filterValue={incomeStatusFilter}
              filterOptions={[
                { value: "all", label: "Todos" },
                { value: "scheduled", label: "Previstos" },
                { value: "received", label: "Recebidos" }
              ]}
              onFilterChange={setIncomeStatusFilter}
              sortId="income-sort"
              sortLabel="Ordenar"
              sortValue={incomeSort}
              sortOptions={[
                { value: "date-desc", label: "Data mais recente" },
                { value: "date-asc", label: "Data mais antiga" },
                { value: "status", label: "Status" },
                { value: "category", label: "Tipo" }
              ]}
              onSortChange={setIncomeSort}
              resultLabel={`${filteredIncomes.length} de ${incomeItems.length} rendas visiveis`}
            />
          ) : null}
          {incomeItems.length === 0 ? <p className="text-sm text-neo-dark/60">Nenhuma renda registrada neste mes.</p> : null}
          {incomeItems.length > 0 && filteredIncomes.length === 0 ? (
            <p className="text-sm text-neo-dark/60">Nenhuma renda encontrada com esse filtro.</p>
          ) : null}
          {filteredIncomes.map((income) => (
            <details
              key={income.id}
              id={`income-${income.id}`}
              open={isFocused(`income-${income.id}`) ? true : undefined}
              className="rounded-none bg-neo-bg p-5"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-neo-dark">{income.title}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neo-pink">
                      {income.categoryLabel} - {income.statusLabel}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neo-dark/60">
                      {income.dateLabel}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neo-pink">
                      {income.recurrenceLabel}
                      {income.installmentLabel ? ` - ${income.installmentLabel}` : ""}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-neo-dark">{formatCurrency(income.amount)}</p>
                </div>
              </summary>
              <form
                className="mt-4 grid gap-4"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  const titulo = String(formData.get("titulo") ?? "");
                  const categoria = String(formData.get("categoria") ?? "SALARIO");
                  const valor = Number(formData.get("valor") ?? 0);
                  const recebidaEm = String(formData.get("recebidaEm") ?? income.plannedDate);
                  const status = String(formData.get("status") ?? "PREVISTO");
                  const frequencia = String(formData.get("frequencia") ?? "UNICA");
                  const parcelasTotais = Number(formData.get("parcelasTotais") ?? 0) || undefined;

                  void runAction(
                    `income-update-${income.id}`,
                    () =>
                      submit(`/api/pessoal/renda/${income.id}`, "PUT", {
                        titulo,
                        categoria,
                        valor,
                        recebidaEm,
                        status,
                        frequencia,
                        parcelasTotais
                      }),
                    "Nao foi possivel atualizar a renda.",
                    "Renda atualizada com sucesso.",
                    {
                      refreshDelayMs: 650,
                      onSuccess: () => {
                        const recurrence = buildRecurrenceSnapshot(
                          frequencia,
                          parcelasTotais,
                          income.installmentCurrent
                        );
                        const received = status === "RECEBIDO";

                        setIncomeItems((current) =>
                          current.map((item) =>
                            item.id === income.id
                              ? {
                                  ...item,
                                  title: titulo,
                                  amount: valor,
                                  categoryLabel: categoria === "SALARIO" ? "Salario" : "Renda extra",
                                  status: received ? "received" : "scheduled",
                                  statusLabel: received ? "Recebido" : "Previsto",
                                  plannedDate: recebidaEm,
                                  referenceDate: recebidaEm,
                                  receivedDate: received ? recebidaEm : undefined,
                                  dateLabel: received
                                    ? formatDueLabelFromDate(recebidaEm, "Recebido em")
                                    : formatDueLabelFromDate(recebidaEm, "Previsto em"),
                                  recurrenceType: recurrence.recurrenceType,
                                  recurrenceLabel: recurrence.recurrenceLabel,
                                  installmentLabel: recurrence.installmentLabel,
                                  installmentCurrent: recurrence.installmentCurrent,
                                  installmentTotal: recurrence.installmentTotal
                                }
                              : item
                          )
                        );
                      }
                    }
                  );
                }}
              >
                <Input id={`income-title-${income.id}`} name="titulo" label="Titulo" defaultValue={income.title} />
                <label className="grid gap-2 text-sm font-medium text-neo-dark/75" htmlFor={`income-category-${income.id}`}>
                  <span>Tipo da renda</span>
                  <select
                    id={`income-category-${income.id}`}
                    name="categoria"
                    defaultValue={income.categoryLabel === "Salario" ? "SALARIO" : "EXTRA"}
                      className="neo-input-surface h-12 rounded-none border-4 border-neo-dark px-4 text-sm text-neo-dark"
                  >
                    <option value="SALARIO">Salario</option>
                    <option value="EXTRA">Renda extra</option>
                  </select>
                </label>
                <Input
                  id={`income-value-${income.id}`}
                  name="valor"
                  label="Valor"
                  type="number"
                  step="0.01"
                  defaultValue={income.amount}
                />
                <Input
                  id={`income-date-${income.id}`}
                  name="recebidaEm"
                  label="Data prevista"
                  type="date"
                  defaultValue={income.plannedDate}
                />
                <label className="grid gap-2 text-sm font-medium text-neo-dark/75" htmlFor={`income-status-${income.id}`}>
                  <span>Status</span>
                  <select
                    id={`income-status-${income.id}`}
                    name="status"
                    defaultValue={income.status === "received" ? "RECEBIDO" : "PREVISTO"}
                      className="neo-input-surface h-12 rounded-none border-4 border-neo-dark px-4 text-sm text-neo-dark"
                  >
                    <option value="PREVISTO">Previsto</option>
                    <option value="RECEBIDO">Recebido</option>
                  </select>
                </label>
                <RecurrenceFields
                  defaultFrequency={uiRecurrenceToApi(income.recurrenceType)}
                  defaultInstallments={income.installmentTotal}
                  installmentsLabel="Parcelas da renda"
                />
                <div className="flex gap-3">
                  <Button disabled={loadingAction === `income-update-${income.id}`}>Atualizar</Button>
                  {income.status !== "received" ? (
                    <MarkIncomeReceivedButton
                      incomeId={income.id}
                      skipRefresh
                      onSuccess={() => {
                        const today = new Date();
                        const receivedDate = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, "0")}-${`${today.getDate()}`.padStart(2, "0")}`;

                        setIncomeItems((current) =>
                          current.map((item) =>
                            item.id === income.id
                              ? {
                                  ...item,
                                  status: "received",
                                  statusLabel: "Recebido",
                                  referenceDate: receivedDate,
                                  receivedDate,
                                  dateLabel: formatDueLabelFromDate(receivedDate, "Recebido em")
                                }
                              : item
                          )
                        );
                        refreshCurrentView(router, pathname, searchParams, { delayMs: 650 });
                      }}
                    />
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={loadingAction === `income-delete-${income.id}`}
                    onClick={() => {
                      void runAction(
                        `income-delete-${income.id}`,
                        () => submit(`/api/pessoal/renda/${income.id}`, "DELETE"),
                        "Nao foi possivel remover a renda.",
                        "Renda removida com sucesso.",
                        {
                          clearFocus: true,
                          refreshDelayMs: 650,
                          onSuccess: () => {
                            setIncomeItems((current) => current.filter((item) => item.id !== income.id));
                          }
                        }
                      );
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </form>
            </details>
          ))}
        </div>
      </Card>

      <Card id="personal-manage-bills" className="bg-neo-bg border-4 border-neo-dark ">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-neo-dark">Gerenciar contas pessoais</h3>
          {personalBillItems.length > 0 ? (
            <ManageListFilters
              searchId="personal-bill-search"
              searchLabel="Buscar conta"
              searchValue={billQuery}
              searchPlaceholder="Titulo ou categoria"
              onSearchChange={setBillQuery}
              filterId="personal-bill-status-filter"
              filterLabel="Status"
              filterValue={billStatusFilter}
              filterOptions={[
                { value: "all", label: "Todos" },
                { value: "warning", label: "Urgentes" },
                { value: "pending", label: "Pendentes" },
                { value: "paid", label: "Pagas" }
              ]}
              onFilterChange={setBillStatusFilter}
              sortId="personal-bill-sort"
              sortLabel="Ordenar"
              sortValue={billSort}
              sortOptions={[
                { value: "due-asc", label: "Vencimento proximo" },
                { value: "due-desc", label: "Vencimento distante" },
                { value: "status", label: "Status" },
                { value: "category", label: "Categoria" }
              ]}
              onSortChange={setBillSort}
              resultLabel={`${filteredPersonalBills.length} de ${personalBillItems.length} contas visiveis`}
            />
          ) : null}
          {personalBillItems.length === 0 ? <p className="text-sm text-neo-dark/60">Nenhuma conta pessoal registrada.</p> : null}
          {personalBillItems.length > 0 && filteredPersonalBills.length === 0 ? (
            <p className="text-sm text-neo-dark/60">Nenhuma conta encontrada com esse filtro.</p>
          ) : null}
          {filteredPersonalBills.map((bill) => (
            <details
              key={bill.id}
              id={`personal-bill-${bill.id}`}
              open={isFocused(`personal-bill-${bill.id}`) ? true : undefined}
              className="rounded-none bg-neo-bg p-5"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-neo-dark">{bill.title}</p>
                    <p className="text-sm text-neo-dark/60">{bill.dueLabel}</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neo-pink">
                      {bill.recurrenceLabel}
                      {bill.installmentLabel ? ` - ${bill.installmentLabel}` : ""}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-neo-dark">{formatCurrency(bill.amount)}</p>
                </div>
              </summary>
              <form
                className="mt-4 grid gap-4"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  const titulo = String(formData.get("titulo") ?? "");
                  const categoria = String(formData.get("categoria") ?? "");
                  const valor = Number(formData.get("valor") ?? 0);
                  const vencimento = String(formData.get("vencimento") ?? bill.dueDate);
                  const observacao = String(formData.get("observacao") ?? "");
                  const status = String(formData.get("status") ?? "PENDENTE");
                  const frequencia = String(formData.get("frequencia") ?? "UNICA");
                  const parcelasTotais = Number(formData.get("parcelasTotais") ?? 0) || undefined;

                  void runAction(
                    `personal-bill-update-${bill.id}`,
                    () =>
                      submit(`/api/pessoal/contas/${bill.id}`, "PUT", {
                        titulo,
                        categoria,
                        valor,
                        vencimento,
                        observacao,
                        status,
                        frequencia,
                        parcelasTotais
                      }),
                    "Nao foi possivel atualizar a conta.",
                    "Conta pessoal atualizada com sucesso.",
                    {
                      refreshDelayMs: 650,
                      onSuccess: () => {
                        if (status === "PAGA") {
                          setPersonalBillItems((current) => current.filter((item) => item.id !== bill.id));
                          return;
                        }

                        const recurrence = buildRecurrenceSnapshot(
                          frequencia,
                          parcelasTotais,
                          bill.installmentCurrent
                        );

                        setPersonalBillItems((current) =>
                          current.map((item) =>
                            item.id === bill.id
                              ? {
                                  ...item,
                                  title: titulo,
                                  category: categoria,
                                  amount: valor,
                                  dueDate: vencimento,
                                  dueLabel: formatDueLabelFromDate(vencimento, "Vence em"),
                                  status: resolveBillStatus(vencimento),
                                  note: observacao || undefined,
                                  recurrenceType: recurrence.recurrenceType,
                                  recurrenceLabel: recurrence.recurrenceLabel,
                                  installmentLabel: recurrence.installmentLabel,
                                  installmentCurrent: recurrence.installmentCurrent,
                                  installmentTotal: recurrence.installmentTotal
                                }
                              : item
                          )
                        );
                      }
                    }
                  );
                }}
              >
                <Input id={`pb-title-${bill.id}`} name="titulo" label="Titulo" defaultValue={bill.title} />
                <Input id={`pb-category-${bill.id}`} name="categoria" label="Categoria" defaultValue={bill.category} />
                <Input
                  id={`pb-value-${bill.id}`}
                  name="valor"
                  label="Valor"
                  type="number"
                  step="0.01"
                  defaultValue={bill.amount}
                />
                <Input
                  id={`pb-date-${bill.id}`}
                  name="vencimento"
                  label="Vencimento"
                  type="date"
                  defaultValue={bill.dueDate}
                />
                <Input id={`pb-note-${bill.id}`} name="observacao" label="Observacao" defaultValue={bill.note ?? ""} />
                <RecurrenceFields
                  defaultFrequency={uiRecurrenceToApi(bill.recurrenceType)}
                  defaultInstallments={bill.installmentTotal}
                  installmentsLabel="Parcelas da conta"
                />
                <label className="grid gap-2 text-sm font-medium text-neo-dark/75" htmlFor={`pb-status-${bill.id}`}>
                  <span>Status</span>
                  <select
                    id={`pb-status-${bill.id}`}
                    name="status"
                    defaultValue={uiStatusToApi(bill.status)}
                  className="neo-input-surface h-12 rounded-none border-4 border-neo-dark px-4 text-sm text-neo-dark"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="PAGA">Paga</option>
                  </select>
                </label>
                <div className="flex gap-3">
                  <Button disabled={loadingAction === `personal-bill-update-${bill.id}`}>Atualizar</Button>
                  {bill.status !== "paid" ? (
                    <MarkPersonalBillPaidButton
                      billId={bill.id}
                      skipRefresh
                      onSuccess={() => {
                        setPersonalBillItems((current) => current.filter((item) => item.id !== bill.id));
                        refreshCurrentView(router, pathname, searchParams, { delayMs: 650 });
                      }}
                    />
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={loadingAction === `personal-bill-delete-${bill.id}`}
                    onClick={() => {
                      void runAction(
                        `personal-bill-delete-${bill.id}`,
                        () => submit(`/api/pessoal/contas/${bill.id}`, "DELETE"),
                        "Nao foi possivel remover a conta.",
                        "Conta pessoal removida com sucesso.",
                        {
                          clearFocus: true,
                          refreshDelayMs: 650,
                          onSuccess: () => {
                            setPersonalBillItems((current) => current.filter((item) => item.id !== bill.id));
                          }
                        }
                      );
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </form>
            </details>
          ))}
        </div>
      </Card>

      <Card id="personal-expense-history" className="bg-transparent  border-none p-0 mt-8">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-neo-dark pl-2">Historico de gastos</h3>
          {expenseItems.length > 0 ? (
            <ManageListFilters
              searchId="personal-expense-search"
              searchLabel="Buscar gasto"
              searchValue={expenseQuery}
              searchPlaceholder="Titulo ou categoria"
              onSearchChange={setExpenseQuery}
              filterId="personal-expense-category-filter"
              filterLabel="Categoria"
              filterValue={expenseCategoryFilter}
              filterOptions={[
                { value: "all", label: "Todas" },
                ...expenseCategories.map((category) => ({ value: category, label: category }))
              ]}
              onFilterChange={setExpenseCategoryFilter}
              sortId="personal-expense-sort"
              sortLabel="Ordenar"
              sortValue={expenseSort}
              sortOptions={[
                { value: "date-desc", label: "Data mais recente" },
                { value: "date-asc", label: "Data mais antiga" },
                { value: "category", label: "Categoria" },
                { value: "amount-desc", label: "Maior valor" }
              ]}
              onSortChange={setExpenseSort}
              resultLabel={`${filteredExpenses.length} de ${expenseItems.length} gastos visiveis`}
            />
          ) : null}
          {expenseItems.length === 0 ? <p className="text-sm text-neo-pink pl-2">Nenhum gasto registrado neste mes.</p> : null}
          {expenseItems.length > 0 && filteredExpenses.length === 0 ? (
            <p className="text-sm text-neo-dark/60 pl-2">Nenhum gasto encontrado com esse filtro.</p>
          ) : null}
          <div className="grid gap-3">
          {filteredExpenses.map((expense) => (
            <details
              key={expense.id}
              id={`expense-${expense.id}`}
              open={isFocused(`expense-${expense.id}`) ? true : undefined}
              className="rounded-none bg-neo-bg p-4 shadow-[4px_4px_0_#0F172A] border border-white/80 transition-all hover:-translate-y-0.5 group"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 outline-none">
                <div className="flex items-center gap-4">
                  <div className="grid h-[3.25rem] w-[3.25rem] shrink-0 place-items-center rounded-full bg-neo-bg/15 text-neo-yellow font-bold text-xl mix-blend-multiply">
                    {expense.category.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-bold text-neo-dark ">{expense.title}</p>
                    <p className="text-xs font-semibold text-neo-pink tracking-wide mt-0.5">{formatDisplayDate(expense.expenseDate)}</p>
                  </div>
                </div>
                <p className="text-base font-bold text-neo-dark tracking-tight">-{formatCurrency(expense.amount)}</p>
              </summary>
              <div className="mt-4 pt-4 border-t border-black/5 opacity-0 group-open:opacity-100 transition-opacity">
              <form
                className="grid gap-4"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  const titulo = String(formData.get("titulo") ?? "");
                  const categoria = String(formData.get("categoria") ?? "");
                  const valor = Number(formData.get("valor") ?? 0);
                  const gastoEm = String(formData.get("gastoEm") ?? expense.expenseDate);
                  void runAction(
                    `expense-update-${expense.id}`,
                    () =>
                      submit(`/api/pessoal/gastos/${expense.id}`, "PUT", {
                        titulo,
                        categoria,
                        valor,
                        gastoEm
                      }),
                    "Nao foi possivel atualizar o gasto.",
                    "Gasto atualizado com sucesso.",
                    {
                      refreshDelayMs: 650,
                      onSuccess: () => {
                        setExpenseItems((current) =>
                          current.map((item) =>
                            item.id === expense.id
                              ? {
                                  ...item,
                                  title: titulo,
                                  category: categoria,
                                  amount: valor,
                                  expenseDate: gastoEm
                                }
                              : item
                          )
                        );
                      }
                    }
                  );
                }}
              >
                <Input id={`expense-title-${expense.id}`} name="titulo" label="Titulo" defaultValue={expense.title} />
                <Input
                  id={`expense-category-${expense.id}`}
                  name="categoria"
                  label="Categoria"
                  defaultValue={expense.category}
                />
                <Input
                  id={`expense-value-${expense.id}`}
                  name="valor"
                  label="Valor"
                  type="number"
                  step="0.01"
                  defaultValue={expense.amount}
                />
                <Input
                  id={`expense-date-${expense.id}`}
                  name="gastoEm"
                  label="Data"
                  type="date"
                  defaultValue={expense.expenseDate}
                />
                <div className="flex gap-3">
                  <Button disabled={loadingAction === `expense-update-${expense.id}`}>Atualizar</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={loadingAction === `expense-delete-${expense.id}`}
                    onClick={() => {
                      void runAction(
                        `expense-delete-${expense.id}`,
                        () => submit(`/api/pessoal/gastos/${expense.id}`, "DELETE"),
                        "Nao foi possivel remover o gasto.",
                        "Gasto removido com sucesso.",
                        {
                          clearFocus: true,
                          refreshDelayMs: 650,
                          onSuccess: () => {
                            setExpenseItems((current) => current.filter((item) => item.id !== expense.id));
                          }
                        }
                      );
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </form>
              </div>
            </details>
          ))}
          </div>
        </div>
      </Card>

      <Card id="personal-manage-goals" className="bg-neo-bg border-4 border-neo-dark ">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-neo-dark">Gerenciar metas</h3>
          {goalItems.length === 0 ? <p className="text-sm text-neo-dark/60">Nenhuma meta registrada neste mes.</p> : null}
          {goalItems.map((goal) => (
            <details
              key={goal.id}
              id={`goal-${goal.id}`}
              open={isFocused(`goal-${goal.id}`) ? true : undefined}
              className="rounded-none bg-neo-bg p-5"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-lg font-semibold text-neo-dark">{goal.label}</p>
                  <p className="text-lg font-semibold text-neo-dark">{formatCurrency(goal.limit)}</p>
                </div>
              </summary>
              <form
                className="mt-4 grid gap-4"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  const categoria = String(formData.get("categoria") ?? "");
                  const valorMeta = Number(formData.get("valorMeta") ?? 0);
                  void runAction(
                    `goal-update-${goal.id}`,
                    () =>
                      submit(`/api/pessoal/metas/${goal.id}`, "PUT", {
                        categoria,
                        valorMeta
                      }),
                    "Nao foi possivel atualizar a meta.",
                    "Meta atualizada com sucesso.",
                    {
                      refreshDelayMs: 650,
                      onSuccess: () => {
                        setGoalItems((current) =>
                          current.map((item) =>
                            item.id === goal.id
                              ? {
                                  ...item,
                                  label: categoria,
                                  limit: valorMeta
                                }
                              : item
                          )
                        );
                      }
                    }
                  );
                }}
              >
                <Input id={`goal-category-${goal.id}`} name="categoria" label="Categoria" defaultValue={goal.label} />
                <Input
                  id={`goal-value-${goal.id}`}
                  name="valorMeta"
                  label="Limite mensal"
                  type="number"
                  step="0.01"
                  defaultValue={goal.limit}
                />
                <div className="flex gap-3">
                  <Button disabled={loadingAction === `goal-update-${goal.id}`}>Atualizar</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={loadingAction === `goal-delete-${goal.id}`}
                    onClick={() => {
                      void runAction(
                        `goal-delete-${goal.id}`,
                        () => submit(`/api/pessoal/metas/${goal.id}`, "DELETE"),
                        "Nao foi possivel remover a meta.",
                        "Meta removida com sucesso.",
                        {
                          clearFocus: true,
                          refreshDelayMs: 650,
                          onSuccess: () => {
                            setGoalItems((current) => current.filter((item) => item.id !== goal.id));
                          }
                        }
                      );
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </form>
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
}
