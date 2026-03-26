"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

import { RecurrenceFields } from "@/components/forms/RecurrenceFields";
import type { CalendarCell, CalendarItem, CalendarScope } from "@/components/calendario/types";
import { requestJson } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";

type AddMode = "house-bill" | "personal-bill" | "income" | null;

const weekdayLabels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    weekday: "long"
  }).format(new Date(`${value}T12:00:00`));
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

  return "bg-neo-cream";
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

function getDefaultMode(scope: CalendarScope): AddMode {
  if (scope === "casa") {
    return "house-bill";
  }

  if (scope === "pessoal") {
    return "personal-bill";
  }

  return null;
}

export function CalendarGridModal({
  activeScope,
  calendarCells
}: {
  activeScope: CalendarScope;
  calendarCells: CalendarCell[];
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<AddMode>(getDefaultMode(activeScope));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [optimisticItemsByDate, setOptimisticItemsByDate] = useState<Record<string, CalendarItem[]>>({});

  const selectedCell = useMemo(
    () => calendarCells.find((cell) => cell.isoDate === selectedDate) ?? null,
    [calendarCells, selectedDate]
  );

  const selectedItems = useMemo(() => {
    if (!selectedCell) {
      return [];
    }

    const optimisticItems = optimisticItemsByDate[selectedCell.isoDate] ?? [];

    return [
      ...selectedCell.items,
      ...optimisticItems.filter(
        (optimisticItem) =>
          !selectedCell.items.some(
            (realItem) =>
              realItem.title === optimisticItem.title &&
              realItem.amount === optimisticItem.amount &&
              realItem.type === optimisticItem.type &&
              realItem.scope === optimisticItem.scope &&
              realItem.date === optimisticItem.date
          )
      )
    ];
  }, [optimisticItemsByDate, selectedCell]);

  useEffect(() => {
    setAddMode(getDefaultMode(activeScope));
  }, [activeScope]);

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    setAddMode((current) => current ?? getDefaultMode(activeScope));
    setError(null);
  }, [selectedDate, activeScope]);

  function openDay(cell: CalendarCell) {
    setSelectedDate(cell.isoDate);
    setError(null);
  }

  function closeModal() {
    setSelectedDate(null);
    setError(null);
    setLoading(false);
    setAddMode(getDefaultMode(activeScope));
  }

  async function submit(url: string, payload: Record<string, unknown>) {
    await requestJson(url, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!selectedDate || !addMode) {
      return;
    }

    const formData = new FormData(form);
    const title = String(formData.get("titulo") ?? "").trim();
    const amount = Number(formData.get("valor"));
    const payloadBase = {
      titulo: title,
      valor: formData.get("valor"),
      frequencia: formData.get("frequencia"),
      parcelasTotais: formData.get("parcelasTotais") || undefined
    };

    setLoading(true);
    setError(null);

    try {
      if (addMode === "house-bill") {
        await submit("/api/casa/contas", {
          ...payloadBase,
          categoria: formData.get("categoria"),
          vencimento: selectedDate,
          observacao: formData.get("observacao")
        });
      }

      if (addMode === "personal-bill") {
        await submit("/api/pessoal/contas", {
          ...payloadBase,
          categoria: formData.get("categoria"),
          vencimento: selectedDate,
          observacao: formData.get("observacao")
        });
      }

      if (addMode === "income") {
        await submit("/api/pessoal/renda", {
          ...payloadBase,
          categoria: formData.get("categoria"),
          recebidaEm: selectedDate,
          status: formData.get("status")
        });
      }

      form.reset();
      setFormVersion((current) => current + 1);
      setOptimisticItemsByDate((current) => {
        const nextItem: CalendarItem =
          addMode === "income"
            ? {
                id: `optimistic-income-${Date.now()}`,
                title,
                amount,
                scope: "Pessoal",
                type: "Recebimento",
                date: selectedDate,
                dateLabel: `Previsto em ${formatLongDate(selectedDate)}`,
                status: String(formData.get("status") ?? "Previsto") === "RECEBIDO" ? "Recebido" : "Previsto",
                recurrenceLabel:
                  String(formData.get("frequencia") ?? "UNICA") === "MENSAL"
                    ? "Mensal"
                    : String(formData.get("frequencia") ?? "UNICA") === "FIXA"
                      ? "Fixa"
                      : String(formData.get("frequencia") ?? "UNICA") === "PARCELADA"
                        ? "Parcelada"
                        : "Unica",
                href: "/gerenciar?tab=pessoal",
                actionLabel: "Abrir gerenciar"
              }
            : {
                id: `optimistic-bill-${Date.now()}`,
                title,
                amount,
                scope: addMode === "house-bill" ? "Casa" : "Pessoal",
                type: "Conta",
                date: selectedDate,
                dateLabel: `Vencimento ${formatLongDate(selectedDate)}`,
                status: "Pendente",
                recurrenceLabel:
                  String(formData.get("frequencia") ?? "UNICA") === "MENSAL"
                    ? "Mensal"
                    : String(formData.get("frequencia") ?? "UNICA") === "FIXA"
                      ? "Fixa"
                      : String(formData.get("frequencia") ?? "UNICA") === "PARCELADA"
                        ? "Parcelada"
                        : "Unica",
                href: addMode === "house-bill" ? "/gerenciar?tab=casa" : "/gerenciar?tab=pessoal",
                actionLabel: "Abrir gerenciar"
              };

        return {
          ...current,
          [selectedDate]: [...(current[selectedDate] ?? []), nextItem]
        };
      });
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Nao foi possivel salvar.");
    } finally {
      setLoading(false);
    }
  }

  const addOptions =
    activeScope === "geral"
      ? [
          { id: "house-bill" as const, label: "Conta da casa", color: "bg-neo-cyan" },
          { id: "personal-bill" as const, label: "Conta pessoal", color: "bg-neo-yellow" },
          { id: "income" as const, label: "Recebimento", color: "bg-neo-lime" }
        ]
      : activeScope === "casa"
        ? [{ id: "house-bill" as const, label: "Conta da casa", color: "bg-neo-cyan" }]
        : [
            { id: "personal-bill" as const, label: "Conta pessoal", color: "bg-neo-yellow" },
            { id: "income" as const, label: "Recebimento", color: "bg-neo-lime" }
          ];
  const hasItems = selectedItems.length > 0;

  return (
    <>
      <div className="grid grid-cols-7 border-[3px] border-neo-dark sm:border-4">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="border-b-[3px] border-r-[3px] border-neo-dark bg-neo-cream px-1 py-2 text-center font-heading text-[10px] uppercase text-neo-dark last:border-r-0 sm:border-b-4 sm:border-r-4 sm:px-2 sm:py-3 sm:text-sm"
          >
            {label}
          </div>
        ))}

        {calendarCells.map((cell, index) => (
          <button
            key={cell.key}
            type="button"
            onClick={() => openDay(cell)}
            className={`relative min-h-[78px] border-r-[3px] border-b-[3px] border-neo-dark px-1.5 py-1.5 text-left transition-transform hover:-translate-y-[1px] sm:min-h-[96px] sm:border-r-4 sm:border-b-4 sm:px-2 sm:py-2 xl:min-h-[132px] xl:px-3 xl:py-3 ${
              index % 7 === 6 ? "border-r-0" : ""
            } ${index >= calendarCells.length - 7 ? "border-b-0" : ""} ${cell.inCurrentMonth ? getCellTone(cell) : "bg-neo-dark/5 text-neo-dark/35"}`}
            aria-label={`${formatLongDate(cell.isoDate)} com ${cell.items.length} registro${cell.items.length === 1 ? "" : "s"}`}
          >
            <div className="flex items-start justify-between gap-1">
              <span className={`font-heading text-lg leading-none sm:text-2xl xl:text-[2rem] ${cell.isToday ? "italic" : ""}`}>
                {cell.dayNumber}
              </span>
              {cell.items.length > 0 ? (
                <span className="hidden rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-neo-dark sm:inline">
                  {cell.items.length}
                </span>
              ) : null}
            </div>

            {cell.items.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1 sm:mt-4 xl:mt-6 xl:gap-1.5">
                {cell.items.slice(0, 3).map((item) => (
                  <span
                    key={item.id}
                    className={`h-2.5 w-2.5 border border-neo-dark sm:h-3 sm:w-3 xl:h-3.5 xl:w-3.5 ${getMarkerClass(item)}`}
                  />
                ))}
                {cell.items.length > 3 ? (
                  <span className="text-[9px] font-black uppercase tracking-[0.08em] text-neo-dark">
                    +{cell.items.length - 3}
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-[9px] font-black uppercase tracking-[0.08em] text-neo-dark/45 sm:mt-4 xl:mt-6">
                Adicionar
              </p>
            )}
          </button>
        ))}
      </div>

      {selectedCell ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-neo-dark/45 px-3 py-5 backdrop-blur-[2px] md:px-6 xl:px-10"
          onClick={closeModal}
        >
          <div
            className="max-h-[92vh] w-full max-w-[1120px] overflow-hidden border-4 border-neo-dark bg-neo-bg shadow-[10px_10px_0_#0F172A] xl:max-w-[1080px] 2xl:max-w-[1160px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b-4 border-neo-dark bg-neo-cream px-4 py-4 sm:px-5 xl:px-7 xl:py-5">
              <div className="max-w-[30rem] xl:max-w-[36rem]">
                <p className="font-heading text-[10px] uppercase tracking-[0.18em] text-neo-pink sm:text-sm sm:tracking-[0.28em]">
                  Agenda do dia
                </p>
                <h2 className="mt-1 font-heading text-2xl uppercase leading-tight text-neo-dark sm:text-3xl xl:text-[2.15rem]">
                  {formatLongDate(selectedCell.isoDate)}
                </h2>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-neo-dark/65 sm:text-sm">
                  {selectedItems.length > 0
                    ? `${selectedItems.length} registro${selectedItems.length === 1 ? "" : "s"} neste dia`
                    : "Nenhum registro neste dia ainda"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-11 w-11 items-center justify-center border-4 border-neo-dark bg-neo-yellow text-neo-dark shadow-[4px_4px_0_#0F172A]"
                aria-label="Fechar agenda do dia"
              >
                <X className="h-5 w-5 stroke-[3px]" />
              </button>
            </div>

            <div
              className={`grid max-h-[calc(92vh-92px)] gap-0 overflow-y-auto ${
                hasItems
                  ? "xl:grid-cols-[minmax(0,1fr)_380px]"
                  : "xl:grid-cols-[minmax(320px,0.72fr)_420px] xl:items-start"
              }`}
            >
              <div className="space-y-4 border-b-4 border-neo-dark p-4 xl:border-b-0 xl:border-r-4 xl:p-6">
                <div className="space-y-2">
                  <p className="font-heading text-[10px] uppercase tracking-[0.18em] text-neo-pink sm:text-sm sm:tracking-[0.24em]">
                    Itens do dia
                  </p>
                  <p className="text-sm font-bold uppercase tracking-[0.08em] text-neo-dark/65">
                    Toque em editar para abrir o registro ja focado.
                  </p>
                </div>

                {selectedItems.length === 0 ? (
                  <div className="grid min-h-[220px] place-items-center border-4 border-neo-dark bg-neo-cream px-4 py-6 text-center xl:min-h-[340px] xl:px-8">
                    <div className="max-w-md space-y-3">
                      <p className="font-heading text-2xl uppercase text-neo-dark xl:text-3xl">
                        Dia livre
                      </p>
                      <p className="text-sm font-bold uppercase tracking-[0.08em] text-neo-dark/65 xl:text-base">
                        Nenhum item neste dia. Use os botoes ao lado para adicionar conta ou recebimento.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {selectedItems.map((item) => (
                      <div
                        key={item.id}
                        className="grid gap-3 border-[3px] border-neo-dark bg-neo-cream px-4 py-4 shadow-[4px_4px_0_#0F172A] sm:border-4 lg:grid-cols-[1fr_auto]"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="border-[3px] border-neo-dark bg-neo-bg px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-neo-dark sm:border-4">
                              {item.scope}
                            </span>
                            <span className="border-[3px] border-neo-dark bg-neo-bg px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-neo-dark sm:border-4">
                              {item.type}
                            </span>
                            <span className={`border-[3px] border-neo-dark px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] sm:border-4 ${getStatusClass(item)}`}>
                              {item.status}
                            </span>
                          </div>
                          <div>
                            <p className="font-heading text-2xl uppercase text-neo-dark">{item.title}</p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-neo-dark/65">
                              {item.dateLabel}
                              {item.recurrenceLabel ? ` - ${item.recurrenceLabel}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 lg:items-end lg:text-right">
                          <p className="font-heading text-3xl uppercase text-neo-dark">
                            {formatCurrency(item.amount)}
                          </p>
                          <a
                            href={item.href}
                            className="inline-flex items-center justify-center border-[3px] border-neo-dark bg-neo-yellow px-4 py-3 font-heading text-base uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1 sm:border-4"
                          >
                            {item.actionLabel}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 xl:p-6">
                <div className="space-y-3">
                  <div>
                    <p className="font-heading text-[10px] uppercase tracking-[0.18em] text-neo-pink sm:text-sm sm:tracking-[0.24em]">
                      Adicionar neste dia
                    </p>
                    <p className="mt-1 text-sm font-bold uppercase tracking-[0.08em] text-neo-dark/65">
                      Crie um registro novo sem sair do calendario.
                    </p>
                  </div>

                  <div className="grid gap-2 xl:gap-3">
                    {addOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setAddMode(option.id)}
                        className={`border-[3px] border-neo-dark px-4 py-3 text-left font-heading text-lg uppercase shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1 sm:border-4 xl:px-5 xl:py-4 xl:text-xl ${
                          addMode === option.id ? option.color : "bg-neo-cream"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {addMode ? (
                  <form
                    key={`${addMode}-${selectedCell.isoDate}-${formVersion}`}
                    className="grid gap-4 border-4 border-neo-dark bg-neo-cream p-4 xl:gap-5 xl:p-5"
                    onSubmit={(event) => void handleSubmit(event)}
                  >
                    <label className="grid gap-2 text-sm font-medium text-neo-dark/75">
                      <span>Titulo</span>
                      <input
                        name="titulo"
                        placeholder={addMode === "income" ? "Salario" : "Aluguel"}
                        className="h-12 rounded-none border-4 border-neo-dark bg-neo-bg px-4 text-sm text-neo-dark outline-none"
                        required
                      />
                    </label>

                    {addMode === "income" ? (
                      <label className="grid gap-2 text-sm font-medium text-neo-dark/75">
                        <span>Tipo da renda</span>
                        <select
                          name="categoria"
                          defaultValue="SALARIO"
                          className="h-12 rounded-none border-4 border-neo-dark bg-neo-bg px-4 text-sm text-neo-dark"
                        >
                          <option value="SALARIO">Salario</option>
                          <option value="EXTRA">Renda extra</option>
                        </select>
                      </label>
                    ) : (
                      <>
                        <label className="grid gap-2 text-sm font-medium text-neo-dark/75">
                          <span>Categoria</span>
                          <input
                            name="categoria"
                            placeholder={addMode === "house-bill" ? "Moradia" : "Financeiro"}
                            className="h-12 rounded-none border-4 border-neo-dark bg-neo-bg px-4 text-sm text-neo-dark outline-none"
                            required
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-medium text-neo-dark/75">
                          <span>Observacao</span>
                          <input
                            name="observacao"
                            placeholder="Opcional"
                            className="h-12 rounded-none border-4 border-neo-dark bg-neo-bg px-4 text-sm text-neo-dark outline-none"
                          />
                        </label>
                      </>
                    )}

                    <label className="grid gap-2 text-sm font-medium text-neo-dark/75">
                      <span>Valor</span>
                      <input
                        name="valor"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="0,00"
                        className="h-12 rounded-none border-4 border-neo-dark bg-neo-bg px-4 text-sm text-neo-dark outline-none"
                        required
                      />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-neo-dark/75">
                      <span>Data escolhida</span>
                      <input
                        value={selectedCell.isoDate}
                        readOnly
                        className="h-12 rounded-none border-4 border-neo-dark bg-neo-bg px-4 text-sm text-neo-dark/70 outline-none"
                      />
                    </label>

                    {addMode === "income" ? (
                      <label className="grid gap-2 text-sm font-medium text-neo-dark/75">
                        <span>Status</span>
                        <select
                          name="status"
                          defaultValue="PREVISTO"
                          className="h-12 rounded-none border-4 border-neo-dark bg-neo-bg px-4 text-sm text-neo-dark"
                        >
                          <option value="PREVISTO">Previsto</option>
                          <option value="RECEBIDO">Recebido</option>
                        </select>
                      </label>
                    ) : null}

                    <RecurrenceFields key={`${addMode}-${selectedCell.isoDate}`} installmentsLabel="Parcelas" />

                    {error ? (
                      <div className="border-4 border-neo-dark bg-neo-pink px-4 py-3 text-sm font-bold text-white">
                        {error}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center border-4 border-neo-dark bg-neo-lime px-4 py-3 font-heading text-lg uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Salvando..." : "Salvar neste dia"}
                    </button>
                  </form>
                ) : (
                  <div className="border-4 border-neo-dark bg-neo-cream px-4 py-5 text-sm font-bold text-neo-dark/65">
                    Escolha se quer criar uma conta da casa, conta pessoal ou recebimento.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
