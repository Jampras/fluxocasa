"use client";

import type { FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { refreshCurrentView } from "@/lib/app-refresh";
import { requestJson } from "@/lib/client-api";
import { ManageListFilters } from "@/components/gerenciar/ManageListFilters";
import { ActionFeedback } from "@/components/ui/ActionFeedback";
import { MarkHouseBillPaidButton } from "@/components/forms/MarkHouseBillPaidButton";
import type { HouseBill, HouseContribution } from "@/types";
import { RecurrenceFields } from "@/components/forms/RecurrenceFields";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";

const now = new Date();

interface HouseActionsProps {
  contributions: HouseContribution[];
  bills: HouseBill[];
}

function uiStatusToApi(status: HouseBill["status"]) {
  return status === "paid" ? "PAGA" : "PENDENTE";
}

function uiRecurrenceToApi(recurrenceType: HouseBill["recurrenceType"]) {
  if (recurrenceType === "monthly") return "MENSAL";
  if (recurrenceType === "installment") return "PARCELADA";
  if (recurrenceType === "fixed") return "FIXA";
  return "UNICA";
}

function uiStatusLabel(status: HouseBill["status"]) {
  if (status === "paid") {
    return "Paga";
  }

  if (status === "warning") {
    return "Urgente";
  }

  return "Pendente";
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

function formatDueLabelFromDate(value: string) {
  return `Vence em ${new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long"
  }).format(new Date(`${value}T12:00:00`))}`;
}

function resolveBillStatus(dueDate: string): HouseBill["status"] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T12:00:00`);
  const remaining = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  return remaining < 0 || (remaining > 0 && remaining <= 3) ? "warning" : "pending";
}

export function HouseActions({ contributions, bills }: HouseActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [billQuery, setBillQuery] = useState("");
  const [billStatusFilter, setBillStatusFilter] = useState("all");
  const [billSort, setBillSort] = useState("due-asc");
  const [contributionItems, setContributionItems] = useState(contributions);
  const [billItems, setBillItems] = useState(bills);
  const currentContribution = contributionItems.find((item) => item.isCurrentUser);
  const focusedItemId = searchParams.get("focus");
  const normalizedBillQuery = normalizeSearch(billQuery);

  const filteredBills = billItems
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
    setContributionItems(contributions);
  }, [contributions]);

  useEffect(() => {
    setBillItems(bills);
  }, [bills]);

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

      <Card id="house-contribution" className="bg-neo-bg">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-2xl font-semibold text-neo-dark">Declarar contribuicao</h3>
            {currentContribution?.contributionId ? (
              <button
                type="button"
                onClick={() => {
              void runAction(
                "delete-contribution",
                () => submit(`/api/casa/contribuicoes/${currentContribution.contributionId}`, "DELETE"),
                "Nao foi possivel remover a contribuicao.",
                "Contribuicao removida com sucesso.",
                {
                  refreshDelayMs: 650,
                  onSuccess: () => {
                    setContributionItems((current) =>
                      current.map((item) =>
                        item.isCurrentUser
                          ? { ...item, amount: 0, status: "pending", contributionId: undefined }
                          : item
                      )
                    );
                  }
                }
              );
            }}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600"
                disabled={loadingAction === "delete-contribution"}
              >
                Remover
              </button>
            ) : null}
          </div>
          <form
            className="grid gap-4 sm:grid-cols-[1fr_auto]"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              void runAction(
                "contribution",
                () =>
                  submit("/api/casa/contribuicoes", "POST", {
                    valor: formData.get("valor"),
                    mes: currentContribution?.month ?? now.getMonth() + 1,
                    ano: currentContribution?.year ?? now.getFullYear()
                  }),
                "Nao foi possivel registrar a contribuicao.",
                "Contribuicao salva com sucesso.",
                {
                  refreshDelayMs: 650,
                  onSuccess: () => {
                    const amount = Number(formData.get("valor") ?? 0);

                    setContributionItems((current) =>
                      current.map((item) =>
                        item.isCurrentUser
                          ? {
                              ...item,
                              amount,
                              status: "confirmed"
                            }
                          : item
                      )
                    );
                  }
                }
              );
            }}
          >
            <Input
              id="valor"
              name="valor"
              label="Valor"
              placeholder="1600"
              type="number"
              step="0.01"
              defaultValue={currentContribution?.status === "confirmed" ? currentContribution.amount : ""}
            />
            <Button className="sm:self-end" disabled={loadingAction === "contribution"}>
              {loadingAction === "contribution" ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </div>
      </Card>

      <Card id="house-create-bill" className="bg-neo-bg border-4 border-neo-dark ">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-neo-dark">Adicionar conta da casa</h3>
          <form
            className="grid gap-4"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              void runAction(
                "bill",
                () =>
                  submit("/api/casa/contas", "POST", {
                    titulo: formData.get("titulo"),
                    categoria: formData.get("categoria"),
                    valor: formData.get("valor"),
                    vencimento: formData.get("vencimento"),
                    observacao: formData.get("observacao"),
                    frequencia: formData.get("frequencia"),
                    parcelasTotais: formData.get("parcelasTotais")
                  }),
                "Nao foi possivel criar a conta.",
                "Conta da casa criada com sucesso."
              );
            }}
          >
            <Input id="titulo" name="titulo" label="Titulo" placeholder="Aluguel" />
            <Input id="categoria" name="categoria" label="Categoria" placeholder="Moradia" />
            <Input id="valorContaCasa" name="valor" label="Valor" placeholder="1800" type="number" step="0.01" />
            <Input id="vencimento" name="vencimento" label="Vencimento" type="date" />
            <Input id="observacao" name="observacao" label="Observacao" placeholder="Opcional" />
            <RecurrenceFields installmentsLabel="Parcelas da conta" />
            <Button fullWidth disabled={loadingAction === "bill"}>
              {loadingAction === "bill" ? "Criando..." : "Criar conta"}
            </Button>
          </form>
        </div>
      </Card>

      <Card id="house-manage-bills" className="bg-neo-bg">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-neo-dark">Gerenciar contas</h3>
          {billItems.length > 0 ? (
            <ManageListFilters
              searchId="house-bill-search"
              searchLabel="Buscar conta da casa"
              searchValue={billQuery}
              searchPlaceholder="Titulo ou categoria"
              onSearchChange={setBillQuery}
              filterId="house-bill-status-filter"
              filterLabel="Status"
              filterValue={billStatusFilter}
              filterOptions={[
                { value: "all", label: "Todos" },
                { value: "warning", label: "Urgentes" },
                { value: "pending", label: "Pendentes" },
                { value: "paid", label: "Pagas" }
              ]}
              onFilterChange={setBillStatusFilter}
              sortId="house-bill-sort"
              sortLabel="Ordenar"
              sortValue={billSort}
              sortOptions={[
                { value: "due-asc", label: "Vencimento proximo" },
                { value: "due-desc", label: "Vencimento distante" },
                { value: "status", label: "Status" },
                { value: "category", label: "Categoria" }
              ]}
              onSortChange={setBillSort}
              resultLabel={`${filteredBills.length} de ${billItems.length} contas visiveis`}
            />
          ) : null}
          {billItems.length === 0 ? <p className="text-sm text-neo-dark/60">Nenhuma conta da casa neste mes.</p> : null}
          {billItems.length > 0 && filteredBills.length === 0 ? (
            <p className="text-sm text-neo-dark/60">Nenhuma conta da casa encontrada com esse filtro.</p>
          ) : null}
          <div className="space-y-4">
            {filteredBills.map((bill) => (
              <details
                key={bill.id}
                id={`house-bill-${bill.id}`}
                open={isFocused(`house-bill-${bill.id}`) ? true : undefined}
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
                    <div className="text-right">
                      <p className="text-lg font-semibold text-neo-dark">{formatCurrency(bill.amount)}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-neo-dark/45">{uiStatusLabel(bill.status)}</p>
                    </div>
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
                      `bill-update-${bill.id}`,
                    () =>
                      submit(`/api/casa/contas/${bill.id}`, "PUT", {
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
                      "Conta da casa atualizada com sucesso.",
                      {
                        refreshDelayMs: 650,
                        onSuccess: () => {
                          const recurrence = buildRecurrenceSnapshot(
                            frequencia,
                            parcelasTotais,
                            bill.installmentCurrent
                          );

                          setBillItems((current) =>
                            current.map((item) =>
                              item.id === bill.id
                                ? {
                                    ...item,
                                    title: titulo,
                                    category: categoria,
                                    amount: valor,
                                    dueDate: vencimento,
                                    dueLabel: formatDueLabelFromDate(vencimento),
                                    status: status === "PAGA" ? "paid" : resolveBillStatus(vencimento),
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
                  <Input name="titulo" id={`bill-title-${bill.id}`} label="Titulo" defaultValue={bill.title} />
                  <Input
                    name="categoria"
                    id={`bill-category-${bill.id}`}
                    label="Categoria"
                    defaultValue={bill.category}
                  />
                  <Input
                    name="valor"
                    id={`bill-value-${bill.id}`}
                    label="Valor"
                    type="number"
                    step="0.01"
                    defaultValue={bill.amount}
                  />
                  <Input
                    name="vencimento"
                    id={`bill-due-${bill.id}`}
                    label="Vencimento"
                    type="date"
                    defaultValue={bill.dueDate}
                  />
                  <Input
                    name="observacao"
                    id={`bill-note-${bill.id}`}
                    label="Observacao"
                    defaultValue={bill.note ?? ""}
                  />
                  <RecurrenceFields
                    defaultFrequency={uiRecurrenceToApi(bill.recurrenceType)}
                    defaultInstallments={bill.installmentTotal}
                    installmentsLabel="Parcelas da conta"
                  />
                  <label className="grid gap-2 text-sm font-medium text-neo-dark/75" htmlFor={`bill-status-${bill.id}`}>
                    <span>Status</span>
                    <select
                      id={`bill-status-${bill.id}`}
                      name="status"
                      defaultValue={uiStatusToApi(bill.status)}
                      className="h-12 rounded-none border-4 border-neo-dark bg-neo-bg px-4 text-sm text-neo-dark"
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="PAGA">Paga</option>
                    </select>
                  </label>
                  <div className="flex gap-3">
                    <Button disabled={loadingAction === `bill-update-${bill.id}`}>Atualizar</Button>
                    {bill.status !== "paid" ? (
                      <MarkHouseBillPaidButton
                        billId={bill.id}
                        skipRefresh
                        onSuccess={() => {
                          setBillItems((current) =>
                            current.map((item) =>
                              item.id === bill.id
                                ? {
                                    ...item,
                                    status: "paid"
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
                      disabled={loadingAction === `bill-delete-${bill.id}`}
                      onClick={() => {
                        void runAction(
                        `bill-delete-${bill.id}`,
                        () => submit(`/api/casa/contas/${bill.id}`, "DELETE"),
                        "Nao foi possivel remover a conta.",
                        "Conta da casa removida com sucesso.",
                        {
                          clearFocus: true,
                          refreshDelayMs: 650,
                          onSuccess: () => {
                            setBillItems((current) => current.filter((item) => item.id !== bill.id));
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
        </div>
      </Card>
    </div>
  );
}
