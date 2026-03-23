"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { requestJson } from "@/lib/client-api";
import type { BudgetGoal, ExpenseRecord, IncomeRecord, PersonalBillRecord } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { MarkPersonalBillPaidButton } from "@/components/forms/MarkPersonalBillPaidButton";

const now = new Date();

function uiStatusToApi(status: PersonalBillRecord["status"]) {
  return status === "paid" ? "PAGA" : "PENDENTE";
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
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function submit(url: string, method: string, payload?: Record<string, unknown>) {
    await requestJson(url, {
      method,
      body: JSON.stringify(payload ?? {})
    });
  }

  async function runAction(action: string, callback: () => Promise<void>, fallback: string) {
    setLoadingAction(action);
    setError(null);

    try {
      await callback();
      refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : fallback);
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="grid gap-6">
      <Card className="bg-neo-bg">
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
                    valor: formData.get("valorRenda"),
                    recebidaEm: formData.get("recebidaEm")
                  }),
                "Nao foi possivel salvar a renda."
              );
            }}
          >
            <Input id="tituloRenda" name="tituloRenda" label="Titulo" placeholder="Salario" />
            <Input id="valorRenda" name="valorRenda" label="Valor" type="number" step="0.01" />
            <Input id="recebidaEm" name="recebidaEm" label="Data de recebimento" type="date" />
            <Button fullWidth disabled={loadingAction === "income"}>
              {loadingAction === "income" ? "Salvando..." : "Salvar renda"}
            </Button>
          </form>
        </div>
      </Card>

      <Card className="bg-neo-bg border-4 border-neo-dark ">
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
                    observacao: formData.get("observacaoConta")
                  }),
                "Nao foi possivel salvar a conta."
              );
            }}
          >
            <Input id="tituloConta" name="tituloConta" label="Titulo" placeholder="Cartao de credito" />
            <Input id="categoriaConta" name="categoriaConta" label="Categoria" placeholder="Financeiro" />
            <Input id="valorConta" name="valorConta" label="Valor" type="number" step="0.01" />
            <Input id="vencimentoConta" name="vencimentoConta" label="Vencimento" type="date" />
            <Input id="observacaoConta" name="observacaoConta" label="Observacao" placeholder="Opcional" />
            <Button fullWidth disabled={loadingAction === "bill"}>
              {loadingAction === "bill" ? "Salvando..." : "Salvar conta"}
            </Button>
          </form>
        </div>
      </Card>

      <Card className="bg-neo-bg">
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
                "Nao foi possivel salvar o gasto."
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

      <Card className="bg-neo-bg border-4 border-neo-dark ">
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
                "Nao foi possivel salvar a meta."
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

      <Card className="bg-neo-bg">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-neo-dark">Gerenciar renda</h3>
          {incomes.length === 0 ? <p className="text-sm text-neo-dark/60">Nenhuma renda registrada neste mes.</p> : null}
          {incomes.map((income) => (
            <details key={income.id} className="rounded-none bg-neo-bg p-5">
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-lg font-semibold text-neo-dark">{income.title}</p>
                  <p className="text-lg font-semibold text-neo-dark">{formatCurrency(income.amount)}</p>
                </div>
              </summary>
              <form
                className="mt-4 grid gap-4"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  void runAction(
                    `income-update-${income.id}`,
                    () =>
                      submit(`/api/pessoal/renda/${income.id}`, "PUT", {
                        titulo: formData.get("titulo"),
                        valor: formData.get("valor"),
                        recebidaEm: formData.get("recebidaEm")
                      }),
                    "Nao foi possivel atualizar a renda."
                  );
                }}
              >
                <Input id={`income-title-${income.id}`} name="titulo" label="Titulo" defaultValue={income.title} />
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
                  label="Recebida em"
                  type="date"
                  defaultValue={income.receivedDate}
                />
                <div className="flex gap-3">
                  <Button disabled={loadingAction === `income-update-${income.id}`}>Atualizar</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={loadingAction === `income-delete-${income.id}`}
                    onClick={() => {
                      void runAction(
                        `income-delete-${income.id}`,
                        () => submit(`/api/pessoal/renda/${income.id}`, "DELETE"),
                        "Nao foi possivel remover a renda."
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

      <Card className="bg-neo-bg border-4 border-neo-dark ">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-neo-dark">Gerenciar contas pessoais</h3>
          {personalBills.length === 0 ? <p className="text-sm text-neo-dark/60">Nenhuma conta pessoal registrada.</p> : null}
          {personalBills.map((bill) => (
            <details key={bill.id} className="rounded-none bg-neo-bg p-5">
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-neo-dark">{bill.title}</p>
                    <p className="text-sm text-neo-dark/60">{bill.dueLabel}</p>
                  </div>
                  <p className="text-lg font-semibold text-neo-dark">{formatCurrency(bill.amount)}</p>
                </div>
              </summary>
              <form
                className="mt-4 grid gap-4"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  void runAction(
                    `personal-bill-update-${bill.id}`,
                    () =>
                      submit(`/api/pessoal/contas/${bill.id}`, "PUT", {
                        titulo: formData.get("titulo"),
                        categoria: formData.get("categoria"),
                        valor: formData.get("valor"),
                        vencimento: formData.get("vencimento"),
                        observacao: formData.get("observacao")
                      }),
                    "Nao foi possivel atualizar a conta."
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
                <label className="grid gap-2 text-sm font-medium text-neo-dark/75" htmlFor={`pb-status-${bill.id}`}>
                  <span>Status</span>
                  <select
                    id={`pb-status-${bill.id}`}
                    name="status"
                    defaultValue={uiStatusToApi(bill.status)}
                    className="h-12 rounded-none border-4 border-neo-dark bg-neo-bg px-4 text-sm text-neo-dark"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="PAGA">Paga</option>
                  </select>
                </label>
                <div className="flex gap-3">
                  <Button disabled={loadingAction === `personal-bill-update-${bill.id}`}>Atualizar</Button>
                  {bill.status !== "paid" ? <MarkPersonalBillPaidButton billId={bill.id} /> : null}
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={loadingAction === `personal-bill-delete-${bill.id}`}
                    onClick={() => {
                      void runAction(
                        `personal-bill-delete-${bill.id}`,
                        () => submit(`/api/pessoal/contas/${bill.id}`, "DELETE"),
                        "Nao foi possivel remover a conta."
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

      <Card className="bg-transparent  border-none p-0 mt-8">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-neo-dark pl-2">Historico de gastos</h3>
          {expenses.length === 0 ? <p className="text-sm text-neo-pink pl-2">Nenhum gasto registrado neste mes.</p> : null}
          <div className="grid gap-3">
          {expenses.map((expense) => (
            <details key={expense.id} className="rounded-none bg-neo-bg p-4 shadow-[4px_4px_0_#0F172A] border border-white/80 transition-all hover:-translate-y-0.5 group">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 outline-none">
                <div className="flex items-center gap-4">
                  <div className="grid h-[3.25rem] w-[3.25rem] shrink-0 place-items-center rounded-full bg-neo-bg/15 text-neo-yellow font-bold text-xl mix-blend-multiply">
                    {expense.category.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-bold text-neo-dark ">{expense.title}</p>
                    <p className="text-xs font-semibold text-neo-pink tracking-wide mt-0.5">{expense.expenseDate}</p>
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
                  void runAction(
                    `expense-update-${expense.id}`,
                    () =>
                      submit(`/api/pessoal/gastos/${expense.id}`, "PUT", {
                        titulo: formData.get("titulo"),
                        categoria: formData.get("categoria"),
                        valor: formData.get("valor"),
                        gastoEm: formData.get("gastoEm")
                      }),
                    "Nao foi possivel atualizar o gasto."
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
                        "Nao foi possivel remover o gasto."
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

      <Card className="bg-neo-bg border-4 border-neo-dark ">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-neo-dark">Gerenciar metas</h3>
          {goals.length === 0 ? <p className="text-sm text-neo-dark/60">Nenhuma meta registrada neste mes.</p> : null}
          {goals.map((goal) => (
            <details key={goal.id} className="rounded-none bg-neo-bg p-5">
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
                  void runAction(
                    `goal-update-${goal.id}`,
                    () =>
                      submit(`/api/pessoal/metas/${goal.id}`, "PUT", {
                        categoria: formData.get("categoria"),
                        valorMeta: formData.get("valorMeta")
                      }),
                    "Nao foi possivel atualizar a meta."
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
                        "Nao foi possivel remover a meta."
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

      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}
