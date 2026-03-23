"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { requestJson } from "@/lib/client-api";
import type { HouseBill, HouseContribution } from "@/types";
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

export function HouseActions({ contributions, bills }: HouseActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const currentContribution = contributions.find((item) => item.isCurrentUser);

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
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-2xl font-semibold text-neo-dark">Declarar contribuicao</h3>
            {currentContribution?.contributionId ? (
              <button
                type="button"
                onClick={() => {
                  void runAction(
                    "delete-contribution",
                    () => submit(`/api/casa/contribuicoes/${currentContribution.contributionId}`, "DELETE"),
                    "Nao foi possivel remover a contribuicao."
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
                "Nao foi possivel registrar a contribuicao."
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
              defaultValue={currentContribution?.amount ?? ""}
            />
            <Button className="sm:self-end" disabled={loadingAction === "contribution"}>
              {loadingAction === "contribution" ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </div>
      </Card>

      <Card className="bg-neo-bg border-4 border-neo-dark ">
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
                    observacao: formData.get("observacao")
                  }),
                "Nao foi possivel criar a conta."
              );
            }}
          >
            <Input id="titulo" name="titulo" label="Titulo" placeholder="Aluguel" />
            <Input id="categoria" name="categoria" label="Categoria" placeholder="Moradia" />
            <Input id="valorContaCasa" name="valor" label="Valor" placeholder="1800" type="number" step="0.01" />
            <Input id="vencimento" name="vencimento" label="Vencimento" type="date" />
            <Input id="observacao" name="observacao" label="Observacao" placeholder="Opcional" />
            <Button fullWidth disabled={loadingAction === "bill"}>
              {loadingAction === "bill" ? "Criando..." : "Criar conta"}
            </Button>
          </form>
        </div>
      </Card>

      <Card className="bg-neo-bg">
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-neo-dark">Gerenciar contas</h3>
          {bills.length === 0 ? <p className="text-sm text-neo-dark/60">Nenhuma conta da casa neste mes.</p> : null}
          <div className="space-y-4">
            {bills.map((bill) => (
              <details key={bill.id} className="rounded-none bg-neo-bg p-5">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-neo-dark">{bill.title}</p>
                      <p className="text-sm text-neo-dark/60">{bill.dueLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-neo-dark">{formatCurrency(bill.amount)}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-neo-dark/45">{bill.status}</p>
                    </div>
                  </div>
                </summary>
                <form
                  className="mt-4 grid gap-4"
                  onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    void runAction(
                      `bill-update-${bill.id}`,
                      () =>
                        submit(`/api/casa/contas/${bill.id}`, "PUT", {
                          titulo: formData.get("titulo"),
                          categoria: formData.get("categoria"),
                          valor: formData.get("valor"),
                          vencimento: formData.get("vencimento"),
                          observacao: formData.get("observacao"),
                          status: formData.get("status")
                        }),
                      "Nao foi possivel atualizar a conta."
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
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={loadingAction === `bill-delete-${bill.id}`}
                      onClick={() => {
                        void runAction(
                          `bill-delete-${bill.id}`,
                          () => submit(`/api/casa/contas/${bill.id}`, "DELETE"),
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
        </div>
      </Card>

      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}
