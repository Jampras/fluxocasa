"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Car,
  Coffee,
  DollarSign,
  Home,
  Plus,
  ShoppingCart,
  Wallet,
  Wrench,
  X
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EscopoTransacao, TipoTransacao } from "@prisma/client";

import { NeoButton } from "@/components/ui/NeoButton";
import { NeoCard } from "@/components/ui/NeoCard";
import { refreshCurrentView } from "@/lib/app-refresh";
import { createTransacao } from "@/server/actions/transactions";

interface CategoryOption {
  id: string;
  label: string;
  icon: JSX.Element;
  color: string;
}

type WizardStep = "scope" | "type" | "category" | "details";

function todayInputValue() {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

function getInitialScope(pathname: string, searchParams: ReturnType<typeof useSearchParams>) {
  if (pathname.startsWith("/casa")) {
    return EscopoTransacao.CASA;
  }

  if (pathname.startsWith("/pessoal")) {
    return EscopoTransacao.PESSOAL;
  }

  if (pathname.startsWith("/dashboard")) {
    const tab = searchParams.get("tab");

    if (tab === "casa") {
      return EscopoTransacao.CASA;
    }

    if (tab === "pessoal") {
      return EscopoTransacao.PESSOAL;
    }
  }

  return null;
}

function getNextStepForScope(scope: EscopoTransacao) {
  return scope === EscopoTransacao.CASA ? "category" : "type";
}

export function FabWizard() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const inferredScope = getInitialScope(pathname, searchParams);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>("scope");
  const [selectedScope, setSelectedScope] = useState<EscopoTransacao | null>(null);
  const [tipo, setTipo] = useState<TipoTransacao>(TipoTransacao.DESPESA);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [incomeStatus, setIncomeStatus] = useState<"PREVISTO" | "RECEBIDO">("PREVISTO");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const currentScope = selectedScope ?? inferredScope ?? EscopoTransacao.PESSOAL;

  const despesaCategories = useMemo<CategoryOption[]>(
    () =>
      currentScope === EscopoTransacao.CASA
        ? [
            {
              id: "MORADIA",
              label: "Moradia",
              icon: <Home size={36} className="stroke-[3px]" />,
              color: "bg-neo-yellow"
            },
            {
              id: "MERCADO",
              label: "Mercado",
              icon: <ShoppingCart size={36} className="stroke-[3px]" />,
              color: "bg-neo-cyan"
            },
            {
              id: "SERVICOS",
              label: "Servicos",
              icon: <Building2 size={36} className="stroke-[3px]" />,
              color: "bg-neo-pink"
            },
            {
              id: "MANUTENCAO",
              label: "Manutencao",
              icon: <Wrench size={36} className="stroke-[3px]" />,
              color: "bg-neo-lime"
            }
          ]
        : [
            {
              id: "CASA",
              label: "Casa",
              icon: <Home size={36} className="stroke-[3px]" />,
              color: "bg-neo-yellow"
            },
            {
              id: "MERCADO",
              label: "Mercado",
              icon: <ShoppingCart size={36} className="stroke-[3px]" />,
              color: "bg-neo-cyan"
            },
            {
              id: "LAZER",
              label: "Lazer",
              icon: <Coffee size={36} className="stroke-[3px]" />,
              color: "bg-neo-pink"
            },
            {
              id: "TRANSPORTE",
              label: "Transporte",
              icon: <Car size={36} className="stroke-[3px]" />,
              color: "bg-neo-lime"
            }
          ],
    [currentScope]
  );

  const receitaCategories = useMemo<CategoryOption[]>(
    () => [
      {
        id: "SALARIO",
        label: "Salario",
        icon: <DollarSign size={36} className="stroke-[3px]" />,
        color: "bg-neo-lime"
      },
      {
        id: "FREELA",
        label: "Freela",
        icon: <Wallet size={36} className="stroke-[3px]" />,
        color: "bg-neo-cyan"
      },
      {
        id: "OUTROS",
        label: "Outros",
        icon: <Plus size={36} className="stroke-[3px]" />,
        color: "bg-neo-yellow"
      }
    ],
    []
  );

  const categoryOptions = tipo === TipoTransacao.RECEITA ? receitaCategories : despesaCategories;

  function resetState() {
    setSelectedScope(inferredScope);
    setStep(inferredScope ? getNextStepForScope(inferredScope) : "scope");
    setTipo(TipoTransacao.DESPESA);
    setCategory("");
    setTitle("");
    setValue("");
    setDate(todayInputValue());
    setIncomeStatus("PREVISTO");
    setError(null);
  }

  function openWizard() {
    resetState();
    setIsOpen(true);
  }

  function closeWizard() {
    setIsOpen(false);
    setLoading(false);
    setError(null);
  }

  function handleSelectScope(scope: EscopoTransacao) {
    setSelectedScope(scope);
    setTipo(TipoTransacao.DESPESA);
    setCategory("");
    setTitle("");
    setError(null);
    setStep(getNextStepForScope(scope));
  }

  function handleSelectTipo(nextTipo: TipoTransacao) {
    setTipo(nextTipo);
    setCategory("");
    setTitle("");
    setError(null);
    setStep("category");
  }

  function handleSelectCategory(option: CategoryOption) {
    setCategory(option.id);
    setTitle((current) => current || option.label);
    setError(null);
    setStep("details");
  }

  function goBack() {
    if (step === "details") {
      setStep("category");
      return;
    }

    if (step === "category") {
      if (currentScope === EscopoTransacao.CASA) {
        if (inferredScope) {
          closeWizard();
          return;
        }

        setSelectedScope(null);
        setStep("scope");
        return;
      }

      setStep("type");
      return;
    }

    if (step === "type") {
      if (inferredScope) {
        closeWizard();
        return;
      }

      setSelectedScope(null);
      setStep("scope");
      return;
    }

    closeWizard();
  }

  async function handleSubmit() {
    const parsedValue = Number.parseFloat(value.replace(",", "."));

    if (!title.trim()) {
      setError("Informe um titulo.");
      return;
    }

    if (!date) {
      setError("Informe uma data.");
      return;
    }

    if (!category) {
      setError("Escolha uma categoria.");
      return;
    }

    if (Number.isNaN(parsedValue) || parsedValue <= 0) {
      setError("Informe um valor valido.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createTransacao({
        titulo: title.trim(),
        valorCentavos: Math.round(parsedValue * 100),
        categoria: category,
        escopo: currentScope,
        tipo: currentScope === EscopoTransacao.CASA ? TipoTransacao.DESPESA : tipo,
        data: date,
        status: currentScope === EscopoTransacao.PESSOAL && tipo === TipoTransacao.RECEITA ? incomeStatus : undefined
      });

      closeWizard();
      setShowToast(true);
      refreshCurrentView(router, pathname, searchParams);

      window.setTimeout(() => {
        setShowToast(false);
      }, 2200);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Nao foi possivel salvar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {showToast ? (
          <motion.div
            initial={{ y: -40, opacity: 0, x: "-50%" }}
            animate={{ y: 20, opacity: 1, x: "-50%" }}
            exit={{ y: -40, opacity: 0, x: "-50%" }}
            className="fixed left-1/2 top-0 z-[100] border-4 border-neo-dark bg-neo-lime px-6 py-4 shadow-[6px_6px_0_#0F172A]"
          >
            <span className="whitespace-nowrap font-heading text-2xl uppercase tracking-widest text-neo-dark">
              Lancamento salvo.
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeWizard}
            className="fixed inset-0 z-50 flex items-center justify-center bg-neo-dark/45 px-4 py-6 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-4xl overflow-hidden border-4 border-neo-dark bg-neo-bg shadow-[10px_10px_0_#0F172A]"
            >
              <div className="flex items-center justify-between border-b-4 border-neo-dark bg-white px-4 py-4 sm:px-5">
                <div>
                  <p className="font-heading text-[10px] uppercase tracking-[0.18em] text-neo-pink sm:text-sm sm:tracking-[0.28em]">
                    Novo lancamento
                  </p>
                  <p className="font-body text-xs font-bold uppercase tracking-[0.12em] text-neo-dark/70 sm:text-sm sm:tracking-wide">
                    Modal rapido com fechar, voltar e salvar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeWizard}
                  className="flex h-11 w-11 items-center justify-center border-4 border-neo-dark bg-neo-yellow text-neo-dark shadow-[4px_4px_0_#0F172A] sm:h-12 sm:w-12"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5 stroke-[3px]" />
                </button>
              </div>

              <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-4 sm:p-5 md:p-8">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <span className="border-4 border-neo-dark bg-white px-4 py-2 font-heading text-lg uppercase text-neo-dark">
                    {currentScope === EscopoTransacao.CASA ? "Casa" : "Pessoal"}
                  </span>
                  <span className="border-4 border-neo-dark bg-white px-4 py-2 font-heading text-lg uppercase text-neo-dark">
                    {currentScope === EscopoTransacao.CASA
                      ? "Conta"
                      : tipo === TipoTransacao.RECEITA
                        ? "Receita"
                        : "Despesa"}
                  </span>
                </div>

                {step === "scope" ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">
                        Escolha o contexto
                      </p>
                      <h2 className="font-heading text-5xl uppercase leading-none text-neo-dark md:text-7xl">
                        Onde voce vai lancar?
                      </h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => handleSelectScope(EscopoTransacao.CASA)}
                        className="border-4 border-neo-dark bg-neo-cyan p-8 text-left shadow-[6px_6px_0_#0F172A] transition-all hover:-translate-y-1"
                      >
                        <p className="font-heading text-4xl uppercase text-neo-dark">Casa</p>
                        <p className="mt-3 font-body text-sm font-bold uppercase tracking-wide text-neo-dark/70">
                          Conta compartilhada, contribuicao e fluxo coletivo.
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectScope(EscopoTransacao.PESSOAL)}
                        className="border-4 border-neo-dark bg-neo-yellow p-8 text-left shadow-[6px_6px_0_#0F172A] transition-all hover:-translate-y-1"
                      >
                        <p className="font-heading text-4xl uppercase text-neo-dark">Pessoal</p>
                        <p className="mt-3 font-body text-sm font-bold uppercase tracking-wide text-neo-dark/70">
                          Renda, conta ou gasto do seu fluxo privado.
                        </p>
                      </button>
                    </div>
                  </div>
                ) : null}

                {step === "type" ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">
                        Escolha o tipo
                      </p>
                      <h2 className="font-heading text-5xl uppercase leading-none text-neo-dark md:text-7xl">
                        O que voce vai registrar?
                      </h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => handleSelectTipo(TipoTransacao.RECEITA)}
                        className="border-4 border-neo-dark bg-neo-lime p-8 text-left shadow-[6px_6px_0_#0F172A] transition-all hover:-translate-y-1"
                      >
                        <p className="font-heading text-4xl uppercase text-neo-dark">Receita</p>
                        <p className="mt-3 font-body text-sm font-bold uppercase tracking-wide text-neo-dark/70">
                          Entradas como salario, freela ou recebimentos extras.
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectTipo(TipoTransacao.DESPESA)}
                        className="border-4 border-neo-dark bg-neo-pink p-8 text-left shadow-[6px_6px_0_#0F172A] transition-all hover:-translate-y-1"
                      >
                        <p className="font-heading text-4xl uppercase text-white">Despesa</p>
                        <p className="mt-3 font-body text-sm font-bold uppercase tracking-wide text-white/80">
                          Contas e gastos que reduzem sua margem no mes.
                        </p>
                      </button>
                    </div>
                  </div>
                ) : null}

                {step === "category" ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">
                        Escolha a categoria
                      </p>
                      <h2 className="font-heading text-5xl uppercase leading-none text-neo-dark md:text-7xl">
                        Qual melhor representa esse item?
                      </h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {categoryOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleSelectCategory(option)}
                          className={`flex flex-col items-start justify-between border-4 border-neo-dark p-6 text-left text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1 ${option.color}`}
                        >
                          <div className="rounded-[1rem] border-4 border-neo-dark bg-white p-3 shadow-[4px_4px_0_#0F172A]">
                            {option.icon}
                          </div>
                          <span className="mt-6 font-heading text-3xl uppercase tracking-wider">
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {step === "details" ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">
                        Finalizar lancamento
                      </p>
                      <h2 className="font-heading text-5xl uppercase leading-none text-neo-dark md:text-7xl">
                        Revise os dados
                      </h2>
                    </div>

                    <NeoCard className="grid gap-5 bg-white p-6">
                      <label className="grid gap-2">
                        <span className="font-heading text-2xl uppercase text-neo-dark">Titulo</span>
                        <input
                          type="text"
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          placeholder="Ex.: aluguel"
                          className="border-4 border-neo-dark bg-neo-bg px-4 py-4 font-body text-xl font-bold outline-none focus:bg-neo-yellow"
                        />
                      </label>

                      <div className="grid gap-5 md:grid-cols-2">
                        <label className="grid gap-2">
                          <span className="font-heading text-2xl uppercase text-neo-dark">Valor</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={value}
                            onChange={(event) => setValue(event.target.value)}
                            placeholder="0,00"
                            className="border-4 border-neo-dark bg-neo-bg px-4 py-4 font-body text-3xl font-black outline-none focus:bg-neo-cyan"
                          />
                        </label>

                        <label className="grid gap-2">
                          <span className="font-heading text-2xl uppercase text-neo-dark">
                            {currentScope === EscopoTransacao.CASA ? "Vencimento" : "Data"}
                          </span>
                          <input
                            type="date"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                            className="border-4 border-neo-dark bg-neo-bg px-4 py-4 font-body text-xl font-bold outline-none focus:bg-neo-lime"
                          />
                        </label>
                      </div>

                      {currentScope === EscopoTransacao.PESSOAL && tipo === TipoTransacao.RECEITA ? (
                        <label className="grid gap-2">
                          <span className="font-heading text-2xl uppercase text-neo-dark">Status</span>
                          <select
                            value={incomeStatus}
                            onChange={(event) => setIncomeStatus(event.target.value as "PREVISTO" | "RECEBIDO")}
                            className="border-4 border-neo-dark bg-neo-bg px-4 py-4 font-body text-xl font-bold outline-none focus:bg-neo-yellow"
                          >
                            <option value="PREVISTO">Previsto</option>
                            <option value="RECEBIDO">Recebido</option>
                          </select>
                        </label>
                      ) : null}

                      <div className="border-4 border-neo-dark bg-neo-yellow px-4 py-3">
                        <p className="font-heading text-xl uppercase text-neo-dark">
                          Categoria: {categoryOptions.find((option) => option.id === category)?.label ?? category}
                        </p>
                      </div>

                      {error ? (
                        <div className="border-4 border-neo-dark bg-neo-pink px-4 py-3 font-body text-base font-bold text-white">
                          {error}
                        </div>
                      ) : null}
                    </NeoCard>
                  </div>
                ) : null}
              </div>

              <div className="sticky bottom-0 flex flex-wrap justify-between gap-3 border-t-4 border-neo-dark bg-white px-4 py-4 sm:px-5">
                <div className="flex flex-wrap gap-3">
                  <NeoButton
                    type="button"
                    variant="secondary"
                    onClick={goBack}
                    className="text-lg"
                  >
                    {step === "scope" ? "Fechar" : "Voltar"}
                  </NeoButton>
                  <NeoButton
                    type="button"
                    variant="secondary"
                    onClick={closeWizard}
                    className="text-lg"
                  >
                    Cancelar
                  </NeoButton>
                </div>

                {step === "details" ? (
                  <NeoButton
                    type="button"
                    className="text-lg"
                    onClick={() => void handleSubmit()}
                    disabled={loading}
                  >
                    {loading ? "Salvando..." : "Salvar"}
                  </NeoButton>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!isOpen ? (
        <motion.button
          type="button"
          onClick={openWizard}
          whileHover={{ scale: 1.05 }}
          className="fixed bottom-24 right-5 z-40 flex h-16 w-16 items-center justify-center border-4 border-neo-dark bg-neo-lime shadow-[5px_5px_0px_#0F172A] transition-colors hover:bg-neo-yellow sm:right-6 sm:h-18 sm:w-18 md:bottom-8 md:right-8 md:h-20 md:w-20 md:shadow-[6px_6px_0px_#0F172A]"
        >
          <Plus size={40} className="stroke-[4px] text-neo-dark sm:h-11 sm:w-11 md:h-12 md:w-12" />
        </motion.button>
      ) : null}
    </>
  );
}
