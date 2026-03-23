"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Car, Coffee, DollarSign, Home, Plus, ShoppingCart, Wallet, Wrench } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EscopoTransacao, TipoTransacao } from "@prisma/client";

import { createTransacao } from "@/server/actions/transactions";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoCard } from "@/components/ui/NeoCard";

interface CategoryOption {
  id: string;
  label: string;
  icon: JSX.Element;
  color: string;
}

function todayInputValue() {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

export function FabWizard() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isHouseScope =
    pathname.startsWith("/casa") ||
    (pathname.startsWith("/dashboard") && searchParams.get("scope") === "home");
  const currentScope = isHouseScope ? EscopoTransacao.CASA : EscopoTransacao.PESSOAL;

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [tipo, setTipo] = useState<TipoTransacao>(TipoTransacao.DESPESA);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const despesaCategories = useMemo<CategoryOption[]>(
    () =>
      isHouseScope
        ? [
            { id: "MORADIA", label: "Moradia", icon: <Home size={40} className="stroke-[3px]" />, color: "bg-neo-yellow" },
            { id: "MERCADO", label: "Mercado", icon: <ShoppingCart size={40} className="stroke-[3px]" />, color: "bg-neo-cyan" },
            { id: "SERVICOS", label: "Servicos", icon: <Building2 size={40} className="stroke-[3px]" />, color: "bg-neo-pink" },
            { id: "MANUTENCAO", label: "Manutencao", icon: <Wrench size={40} className="stroke-[3px]" />, color: "bg-neo-lime" }
          ]
        : [
            { id: "CASA", label: "Casa", icon: <Home size={40} className="stroke-[3px]" />, color: "bg-neo-yellow" },
            { id: "MERCADO", label: "Mercado", icon: <ShoppingCart size={40} className="stroke-[3px]" />, color: "bg-neo-cyan" },
            { id: "LAZER", label: "Lazer", icon: <Coffee size={40} className="stroke-[3px]" />, color: "bg-neo-pink" },
            { id: "TRANSPORTE", label: "Transporte", icon: <Car size={40} className="stroke-[3px]" />, color: "bg-neo-lime" }
          ],
    [isHouseScope]
  );

  const receitaCategories = useMemo<CategoryOption[]>(
    () => [
      { id: "SALARIO", label: "Salario", icon: <DollarSign size={40} className="stroke-[3px]" />, color: "bg-neo-lime" },
      { id: "FREELA", label: "Freela", icon: <Wallet size={40} className="stroke-[3px]" />, color: "bg-neo-cyan" },
      { id: "OUTROS", label: "Outros", icon: <Plus size={40} className="stroke-[3px]" />, color: "bg-neo-yellow" }
    ],
    []
  );

  const categoryOptions = tipo === TipoTransacao.RECEITA ? receitaCategories : despesaCategories;

  function resetState() {
    setStep(isHouseScope ? 1 : 0);
    setTipo(TipoTransacao.DESPESA);
    setCategory("");
    setTitle("");
    setValue("");
    setDate(todayInputValue());
    setError(null);
  }

  function toggleOpen() {
    if (!isOpen) {
      resetState();
    }

    setIsOpen((current) => !current);
  }

  function handleSelectTipo(nextTipo: TipoTransacao) {
    setTipo(nextTipo);
    setCategory("");
    setTitle("");
    setError(null);
    setStep(1);
  }

  function handleSelectCategory(option: CategoryOption) {
    setCategory(option.id);
    setTitle((current) => current || option.label);
    setError(null);
    setStep(2);
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
        tipo,
        data: date
      });

      setIsOpen(false);
      setShowToast(true);

      window.setTimeout(() => {
        setShowToast(false);
        router.refresh();
      }, 2500);
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
            <span className="whitespace-nowrap font-heading text-3xl uppercase tracking-widest text-neo-dark">
              Lancamento salvo.
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-neo-bg p-6"
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-5"
              style={{
                backgroundImage: "radial-gradient(circle, #0F172A 1.5px, transparent 1.5px)",
                backgroundSize: "24px 24px"
              }}
            />

            <div className="relative z-10 mt-6 flex h-full flex-1 flex-col justify-center pb-20">
              <AnimatePresence mode="wait">
                {step === 0 ? (
                  <motion.div
                    key="step0"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    className="mx-auto flex w-full max-w-xl flex-col gap-8"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="flex-1 font-heading text-6xl uppercase leading-none text-neo-dark md:text-8xl">
                        O QUE VOCE VAI LANCAR?
                      </h2>
                      <button
                        type="button"
                        onClick={toggleOpen}
                        className="flex h-12 w-12 items-center justify-center border-4 border-neo-dark bg-white text-2xl font-bold shadow-[4px_4px_0_#0F172A]"
                      >
                        X
                      </button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => handleSelectTipo(TipoTransacao.RECEITA)}
                        className="border-4 border-neo-dark bg-neo-lime p-10 font-heading text-4xl uppercase text-neo-dark shadow-[6px_6px_0_#0F172A] transition-transform hover:-translate-y-2"
                      >
                        Receita
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectTipo(TipoTransacao.DESPESA)}
                        className="border-4 border-neo-dark bg-neo-pink p-10 font-heading text-4xl uppercase text-white shadow-[6px_6px_0_#0F172A] transition-transform hover:-translate-y-2"
                      >
                        Despesa
                      </button>
                    </div>
                  </motion.div>
                ) : null}

                {step === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    className="mx-auto flex w-full max-w-xl flex-col gap-8"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => (isHouseScope ? toggleOpen() : setStep(0))}
                        className="bg-white px-4 py-2 font-body font-bold border-4 border-neo-dark shadow-[4px_4px_0_#0F172A]"
                      >
                        {isHouseScope ? "Fechar" : "Voltar"}
                      </button>
                      <button
                        type="button"
                        onClick={toggleOpen}
                        className="flex h-12 w-12 items-center justify-center border-4 border-neo-dark bg-white text-2xl font-bold shadow-[4px_4px_0_#0F172A]"
                      >
                        X
                      </button>
                    </div>

                    <div className="space-y-3">
                      <p className="font-heading text-sm uppercase tracking-[0.3em] text-neo-pink">
                        {isHouseScope ? "Casa" : tipo === TipoTransacao.RECEITA ? "Receita" : "Despesa"}
                      </p>
                      <h2 className="font-heading text-6xl uppercase leading-none text-neo-dark md:text-8xl">
                        {isHouseScope ? "QUAL E A CONTA?" : "QUAL E A CATEGORIA?"}
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {categoryOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleSelectCategory(option)}
                          className={`flex flex-col items-center justify-center border-4 border-neo-dark p-6 text-neo-dark shadow-[4px_4px_0_#0F172A] ${option.color}`}
                        >
                          <div className="mb-4 rounded-[1rem] border-4 border-neo-dark bg-white p-4 shadow-[4px_4px_0_#0F172A]">
                            {option.icon}
                          </div>
                          <span className="font-heading text-2xl uppercase tracking-wider">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : null}

                {step === 2 ? (
                  <motion.div
                    key="step2"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    className="mx-auto flex w-full max-w-2xl flex-col gap-6"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="bg-white px-4 py-2 font-body font-bold border-4 border-neo-dark shadow-[4px_4px_0_#0F172A]"
                      >
                        Voltar
                      </button>
                      <button
                        type="button"
                        onClick={toggleOpen}
                        className="flex h-12 w-12 items-center justify-center border-4 border-neo-dark bg-white text-2xl font-bold shadow-[4px_4px_0_#0F172A]"
                      >
                        X
                      </button>
                    </div>

                    <div className="space-y-3">
                      <p className="font-heading text-sm uppercase tracking-[0.3em] text-neo-pink">
                        {currentScope === EscopoTransacao.CASA ? "Casa" : "Pessoal"}
                      </p>
                      <h2 className="font-heading text-5xl uppercase leading-none text-neo-dark md:text-7xl">
                        FECHAR LANCAMENTO
                      </h2>
                    </div>

                    <NeoCard className="grid gap-5 bg-white p-8 shadow-[6px_6px_0_#0F172A]">
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

                    <NeoButton
                      size="lg"
                      className="w-full py-6 text-4xl"
                      onClick={() => void handleSubmit()}
                      disabled={loading}
                    >
                      {loading ? "Salvando..." : "Salvar"}
                    </NeoButton>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!isOpen ? (
        <motion.button
          type="button"
          onClick={toggleOpen}
          whileHover={{ scale: 1.05 }}
          className="fixed bottom-24 right-8 z-50 flex h-20 w-20 items-center justify-center border-4 border-neo-dark bg-neo-lime shadow-[6px_6px_0px_#0F172A] transition-colors hover:bg-neo-yellow md:bottom-8"
        >
          <Plus size={48} className="stroke-[4px] text-neo-dark" />
        </motion.button>
      ) : null}
    </>
  );
}
