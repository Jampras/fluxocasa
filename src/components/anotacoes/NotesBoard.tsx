"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Globe2,
  GripVertical,
  Home,
  Lock,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
  X
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ActionFeedback } from "@/components/ui/ActionFeedback";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { requestJson } from "@/lib/client-api";
import { refreshCurrentView } from "@/lib/app-refresh";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { NoteRecord, NotesBoardSnapshot } from "@/types";

interface NotesBoardProps {
  initialSnapshot: NotesBoardSnapshot;
}

type ScopeFormValue = "PESSOAL" | "CASA";
type VisibilityFormValue = "PRIVADA" | "PUBLICA";

interface NoteFormState {
  titulo: string;
  conteudo: string;
  tag: string;
  escopo: ScopeFormValue;
  visibilidade: VisibilityFormValue;
}

const EMPTY_FORM: NoteFormState = {
  titulo: "",
  conteudo: "",
  tag: "",
  escopo: "PESSOAL",
  visibilidade: "PRIVADA"
};

function getVisibilityIcon(note: NoteRecord) {
  if (note.scope === "house") {
    return Home;
  }

  return note.visibility === "public" ? Globe2 : Lock;
}

function buildPayload(form: NoteFormState) {
  return {
    titulo: form.titulo,
    conteudo: form.conteudo,
    tag: form.tag,
    escopo: form.escopo,
    isPublica: form.escopo === "CASA" ? true : form.visibilidade === "PUBLICA"
  };
}

function mapNoteToForm(note: NoteRecord): NoteFormState {
  return {
    titulo: note.title,
    conteudo: note.content,
    tag: note.tag === "Casa" || note.tag === "Pessoal" ? "" : note.tag,
    escopo: note.scope === "house" ? "CASA" : "PESSOAL",
    visibilidade: note.visibility === "public" || note.scope === "house" ? "PUBLICA" : "PRIVADA"
  };
}

export function NotesBoard({ initialSnapshot }: NotesBoardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteRecord | null>(null);
  const [form, setForm] = useState<NoteFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.toggle("wizard-open", isModalOpen);

    return () => {
      document.body.classList.remove("wizard-open");
    };
  }, [isModalOpen]);

  function openCreateModal() {
    setEditingNote(null);
    setForm(EMPTY_FORM);
    setError(null);
    setIsModalOpen(true);
  }

  function openQuickCreate(scope: ScopeFormValue, visibility: VisibilityFormValue = "PRIVADA") {
    setEditingNote(null);
    setForm({
      ...EMPTY_FORM,
      escopo: scope,
      visibilidade: scope === "CASA" ? "PUBLICA" : visibility
    });
    setError(null);
    setIsModalOpen(true);
  }

  function openEditModal(note: NoteRecord) {
    setEditingNote(note);
    setForm(mapNoteToForm(note));
    setError(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingNote(null);
    setForm(EMPTY_FORM);
    setError(null);
    setLoading(false);
  }

  async function syncBoard(options?: { clearFocus?: boolean }) {
    const nextSnapshot = await requestJson<NotesBoardSnapshot>("/api/anotacoes");
    setSnapshot(nextSnapshot);
    refreshCurrentView(router, pathname, searchParams, {
      clearFocus: options?.clearFocus,
      delayMs: 120
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.titulo.trim().length < 2) {
      setError("Informe um titulo para a anotacao.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingNote) {
        await requestJson(`/api/anotacoes/${editingNote.id}`, {
          method: "PUT",
          body: JSON.stringify(buildPayload(form))
        });
      } else {
        await requestJson("/api/anotacoes", {
          method: "POST",
          body: JSON.stringify(buildPayload(form))
        });
      }

      closeModal();
      setFeedback(editingNote ? "Anotacao atualizada." : "Anotacao criada.");
      void syncBoard();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Nao foi possivel salvar a anotacao.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(note: NoteRecord) {
    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      await requestJson(`/api/anotacoes/${note.id}`, {
        method: "DELETE",
        body: JSON.stringify({})
      });
      setFeedback("Anotacao removida.");
      void syncBoard();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Nao foi possivel remover a anotacao.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMove(noteId: string, direction: "up" | "down") {
    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      await requestJson("/api/anotacoes/reordenar", {
        method: "PATCH",
        body: JSON.stringify({ noteId, direction })
      });
      setFeedback("Ordem atualizada.");
      void syncBoard();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Nao foi possivel mover a anotacao.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDropMove(noteId: string, targetNoteId: string) {
    if (noteId === targetNoteId) {
      setDraggedNoteId(null);
      setDropTargetId(null);
      return;
    }

    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      await requestJson("/api/anotacoes/reordenar", {
        method: "PATCH",
        body: JSON.stringify({ noteId, targetNoteId })
      });
      setFeedback("Ordem atualizada.");
      void syncBoard();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Nao foi possivel mover a anotacao.");
    } finally {
      setDraggedNoteId(null);
      setDropTargetId(null);
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();

    const syncFromServer = async () => {
      try {
        const nextSnapshot = await requestJson<NotesBoardSnapshot>("/api/anotacoes");

        if (!cancelled) {
          setSnapshot(nextSnapshot);
        }
      } catch {
        // Ignore transient sync failures; local mutations already refresh the mural.
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncFromServer();
      }
    };

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (!supabase) {
      const intervalHandle = window.setInterval(() => {
        void syncFromServer();
      }, 8000);

      return () => {
        cancelled = true;
        window.clearInterval(intervalHandle);
        window.removeEventListener("focus", handleVisibilityChange);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }

    const channel = supabase
      .channel("notes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "Nota" }, () => {
        void syncFromServer();
      })
      .subscribe();

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="space-y-5 sm:space-y-6">
      {feedback ? <ActionFeedback tone="success" message={feedback} /> : null}
      {error && !isModalOpen ? <ActionFeedback tone="error" message={error} /> : null}

      <Card className="overflow-hidden bg-white p-0">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="space-y-4 border-b-4 border-neo-dark p-5 lg:border-b-0 lg:border-r-4 lg:p-6">
            <div className="space-y-1.5">
              <p className="font-heading text-[10px] uppercase tracking-[0.22em] text-neo-pink sm:text-sm sm:tracking-[0.28em]">
                Mural vivo
              </p>
              <p className="max-w-3xl font-body text-sm font-bold uppercase tracking-[0.12em] text-neo-dark/75 sm:text-base sm:tracking-wide">
                Crie recados em segundos, arraste para reorganizar e acompanhe as mudancas sem recarregar a tela.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => openQuickCreate("PESSOAL", "PRIVADA")}
                className="neo-pressable flex min-h-[112px] flex-col items-start justify-between border-4 border-neo-dark bg-[#ffdbe8] px-4 py-4 text-left text-neo-dark shadow-[5px_5px_0_#0F172A]"
              >
                <Lock className="h-5 w-5 stroke-[2.8px]" />
                <div>
                  <p className="font-heading text-2xl uppercase leading-none">Privada</p>
                  <p className="mt-2 font-body text-[11px] font-black uppercase tracking-[0.14em] text-neo-dark/70">
                    So voce ve
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => openQuickCreate("PESSOAL", "PUBLICA")}
                className="neo-pressable flex min-h-[112px] flex-col items-start justify-between border-4 border-neo-dark bg-neo-yellow px-4 py-4 text-left text-neo-dark shadow-[5px_5px_0_#0F172A]"
              >
                <Globe2 className="h-5 w-5 stroke-[2.8px]" />
                <div>
                  <p className="font-heading text-2xl uppercase leading-none">Publica</p>
                  <p className="mt-2 font-body text-[11px] font-black uppercase tracking-[0.14em] text-neo-dark/70">
                    Pessoal visivel para a casa
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => openQuickCreate("CASA")}
                className="neo-pressable flex min-h-[112px] flex-col items-start justify-between border-4 border-neo-dark bg-neo-lime px-4 py-4 text-left text-neo-dark shadow-[5px_5px_0_#0F172A]"
              >
                <Home className="h-5 w-5 stroke-[2.8px]" />
                <div>
                  <p className="font-heading text-2xl uppercase leading-none">Da casa</p>
                  <p className="mt-2 font-body text-[11px] font-black uppercase tracking-[0.14em] text-neo-dark/70">
                    Combinado compartilhado
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="grid gap-3 p-5 lg:p-6">
            <div className="border-4 border-neo-dark bg-neo-bg px-4 py-4 shadow-[5px_5px_0_#0F172A]">
              <p className="font-heading text-sm uppercase tracking-[0.22em] text-neo-pink">Como usar</p>
              <p className="mt-3 font-body text-sm font-bold uppercase tracking-[0.12em] text-neo-dark/75">
                Abra uma nota rapida, toque para editar, exclua quando terminar e arraste os cards para deixar o mural na ordem certa.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border-4 border-neo-dark bg-white px-4 py-4 shadow-[5px_5px_0_#0F172A]">
                <p className="font-heading text-xs uppercase tracking-[0.22em] text-neo-pink">Visibilidade</p>
                <p className="mt-3 font-body text-sm font-black uppercase tracking-[0.12em] text-neo-dark/75">
                  Privada, publica ou da casa
                </p>
              </div>
              <div className="border-4 border-neo-dark bg-white px-4 py-4 shadow-[5px_5px_0_#0F172A]">
                <p className="font-heading text-xs uppercase tracking-[0.22em] text-neo-pink">Ordem</p>
                <p className="mt-3 font-body text-sm font-black uppercase tracking-[0.12em] text-neo-dark/75">
                  Arraste no desktop ou use subir e descer no mobile
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="font-heading text-[10px] uppercase tracking-[0.22em] text-neo-pink sm:text-sm sm:tracking-[0.28em]">
            Mural da casa
          </p>
          <p className="max-w-3xl font-body text-sm font-bold uppercase tracking-[0.12em] text-neo-dark/75 sm:text-base sm:tracking-wide">
            Veja tudo em uma grade unica. O foco aqui e criar rapido, ler facil, editar quando precisar e reorganizar sem atrito.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4 stroke-[3px]" />
          Nova anotacao
        </Button>
      </div>

      {snapshot.notes.length === 0 ? (
        <Card className="border-dashed bg-white p-6 text-center sm:p-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border-4 border-neo-dark bg-neo-yellow shadow-[4px_4px_0_#0F172A]">
            <StickyNote className="h-8 w-8 stroke-[2.8px] text-neo-dark" />
          </div>
          <h2 className="font-heading text-3xl uppercase text-neo-dark">Seu mural esta vazio</h2>
          <p className="mx-auto mt-3 max-w-xl font-body text-sm font-bold uppercase tracking-[0.12em] text-neo-dark/70 sm:text-base">
            Crie a primeira anotacao para guardar recados pessoais, lembretes publicos ou combinados da casa.
          </p>
        </Card>
      ) : (
        <div className="columns-1 gap-4 min-[520px]:columns-2 xl:columns-3">
          {snapshot.notes.map((note) => {
            const VisibilityIcon = getVisibilityIcon(note);
            const canDrag = note.canEdit;

            return (
              <article
                key={note.id}
                draggable={canDrag}
                onDragStart={() => {
                  if (canDrag) {
                    setDraggedNoteId(note.id);
                    setDropTargetId(note.id);
                  }
                }}
                onDragOver={(event) => {
                  if (draggedNoteId && draggedNoteId !== note.id) {
                    event.preventDefault();
                    setDropTargetId(note.id);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();

                  if (draggedNoteId && draggedNoteId !== note.id) {
                    void handleDropMove(draggedNoteId, note.id);
                  }
                }}
                onDragEnd={() => {
                  setDraggedNoteId(null);
                  setDropTargetId(null);
                }}
                className={`mb-4 break-inside-avoid rounded-none border-[3px] border-neo-dark bg-white shadow-[4px_4px_0_#0F172A] transition-transform sm:border-4 sm:shadow-[6px_6px_0_#0F172A] ${
                  draggedNoteId === note.id ? "opacity-60" : ""
                } ${dropTargetId === note.id && draggedNoteId !== note.id ? "-translate-y-1 ring-4 ring-neo-cyan/60" : ""}`}
              >
                <div className={`border-b-[3px] border-neo-dark px-4 py-3 sm:border-b-4 sm:px-5 ${note.accentClass}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 border-[3px] border-neo-dark bg-white px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-[0.16em] text-neo-dark sm:border-4">
                          {note.tag}
                        </span>
                        <span className={`inline-flex h-9 w-9 items-center justify-center border-[3px] border-neo-dark text-neo-dark sm:border-4 ${note.iconToneClass}`}>
                          <VisibilityIcon className="h-4 w-4 stroke-[2.8px]" />
                        </span>
                        <span
                          className={`hidden md:inline-flex h-9 w-9 items-center justify-center border-[3px] border-neo-dark bg-white text-neo-dark sm:border-4 ${canDrag ? "cursor-grab" : "opacity-50"}`}
                          title={canDrag ? "Arraste para reorganizar." : "Voce nao pode reorganizar esta anotacao."}
                        >
                          <GripVertical className="h-4 w-4 stroke-[2.8px]" />
                        </span>
                      </div>
                      <h3 className="font-heading text-3xl uppercase leading-[0.94] text-neo-dark sm:text-[2.2rem]">
                        {note.title}
                      </h3>
                    </div>
                    <span className="font-body text-[10px] font-black uppercase tracking-[0.16em] text-neo-dark/70">
                      {note.createdAtLabel}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex border-[3px] border-neo-dark bg-white px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-[0.14em] text-neo-dark">
                      {note.visibilityLabel}
                    </span>
                    <span className="inline-flex border-[3px] border-neo-dark bg-white px-2.5 py-1 font-body text-[10px] font-black uppercase tracking-[0.14em] text-neo-dark">
                      {note.scopeLabel}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap font-body text-sm font-bold leading-6 text-neo-dark/80 sm:text-[15px]">
                    {note.content || "Sem texto adicional."}
                  </p>

                  <div className="space-y-1 text-[10px] font-black uppercase tracking-[0.16em] text-neo-dark/65">
                    <p>Criada por {note.ownerName}</p>
                    {note.updatedAtLabel ? <p>{note.updatedAtLabel}</p> : null}
                  </div>

                  {note.canEdit || note.canDelete ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-11 px-3 text-xs md:hidden"
                        onClick={() => void handleMove(note.id, "up")}
                        disabled={loading}
                        title="Mover para cima"
                      >
                        <ArrowUp className="mr-1 h-4 w-4 stroke-[2.8px]" />
                        Subir
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-11 px-3 text-xs md:hidden"
                        onClick={() => void handleMove(note.id, "down")}
                        disabled={loading}
                        title="Mover para baixo"
                      >
                        <ArrowDown className="mr-1 h-4 w-4 stroke-[2.8px]" />
                        Descer
                      </Button>
                      {note.canEdit ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-11 px-4 text-xs"
                          onClick={() => openEditModal(note)}
                        >
                          <Pencil className="mr-2 h-4 w-4 stroke-[2.8px]" />
                          Editar
                        </Button>
                      ) : null}
                      {note.canDelete ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-11 bg-neo-pink px-4 text-xs text-white"
                          onClick={() => void handleDelete(note)}
                          disabled={loading}
                        >
                          <Trash2 className="mr-2 h-4 w-4 stroke-[2.8px]" />
                          Excluir
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!isModalOpen ? (
        <button
          type="button"
          onClick={openCreateModal}
          aria-label="Nova anotacao"
          title="Nova anotacao"
          className="neo-pressable fixed bottom-24 right-5 z-30 flex h-16 w-16 items-center justify-center border-4 border-neo-dark bg-neo-lime text-neo-dark shadow-[5px_5px_0_#0F172A] md:bottom-8 md:right-8 md:h-20 md:w-20 md:shadow-[6px_6px_0_#0F172A]"
        >
          <Plus className="h-9 w-9 stroke-[3.2px]" />
        </button>
      ) : null}

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neo-dark/45 px-3 py-3 backdrop-blur-[2px] sm:px-4 sm:py-6"
          onClick={closeModal}
        >
          <div
            className="flex max-h-[calc(100vh-1rem)] w-full max-w-3xl flex-col overflow-hidden border-4 border-neo-dark bg-neo-bg shadow-[10px_10px_0_#0F172A]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-4 border-neo-dark bg-white px-4 py-3 sm:px-5 sm:py-4">
              <div>
                <p className="font-heading text-[10px] uppercase tracking-[0.18em] text-neo-pink sm:text-sm sm:tracking-[0.28em]">
                  {editingNote ? "Editar anotacao" : "Nova anotacao"}
                </p>
                <p className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-neo-dark/70 sm:text-sm sm:tracking-wide">
                  Salve recados privados, publicos ou combinados da casa.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="neo-pressable flex h-11 w-11 items-center justify-center border-4 border-neo-dark bg-neo-yellow text-neo-dark shadow-[4px_4px_0_#0F172A]"
                aria-label="Fechar"
              >
                <X className="h-5 w-5 stroke-[3px]" />
              </button>
            </div>

            <form className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6" onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="font-heading text-lg uppercase text-neo-dark sm:text-xl">Titulo</span>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))}
                    className="border-4 border-neo-dark bg-white px-4 py-3 font-body text-base font-bold text-neo-dark outline-none focus:bg-neo-yellow"
                    placeholder="Ex.: feira do sabado"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="font-heading text-lg uppercase text-neo-dark sm:text-xl">Texto</span>
                  <textarea
                    value={form.conteudo}
                    onChange={(event) => setForm((current) => ({ ...current, conteudo: event.target.value }))}
                    rows={5}
                    className="min-h-[150px] border-4 border-neo-dark bg-white px-4 py-3 font-body text-base font-bold text-neo-dark outline-none focus:bg-neo-cyan"
                    placeholder="Escreva o lembrete, recado ou combinado."
                  />
                </label>

                <label className="grid gap-2">
                  <span className="font-heading text-lg uppercase text-neo-dark sm:text-xl">Tag</span>
                  <input
                    type="text"
                    value={form.tag}
                    onChange={(event) => setForm((current) => ({ ...current, tag: event.target.value }))}
                    className="border-4 border-neo-dark bg-white px-4 py-3 font-body text-base font-bold text-neo-dark outline-none focus:bg-neo-lime"
                    placeholder="Ex.: compras, tarefas, recados"
                  />
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="grid gap-2">
                    <span className="font-heading text-lg uppercase text-neo-dark sm:text-xl">Tipo</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, escopo: "PESSOAL" }))}
                        className={`neo-pressable border-4 border-neo-dark px-4 py-3 font-heading text-base uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] ${form.escopo === "PESSOAL" ? "bg-neo-yellow" : "bg-white"}`}
                      >
                        Pessoal
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((current) => ({ ...current, escopo: "CASA", visibilidade: "PUBLICA" }))
                        }
                        className={`neo-pressable border-4 border-neo-dark px-4 py-3 font-heading text-base uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] ${form.escopo === "CASA" ? "bg-neo-lime" : "bg-white"}`}
                      >
                        Da casa
                      </button>
                    </div>
                  </div>

                  {form.escopo === "PESSOAL" ? (
                    <div className="grid gap-2">
                      <span className="font-heading text-lg uppercase text-neo-dark sm:text-xl">Visibilidade</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, visibilidade: "PRIVADA" }))}
                          className={`neo-pressable border-4 border-neo-dark px-4 py-3 font-heading text-base uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] ${form.visibilidade === "PRIVADA" ? "bg-[#ffdbe8]" : "bg-white"}`}
                        >
                          Privada
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, visibilidade: "PUBLICA" }))}
                          className={`neo-pressable border-4 border-neo-dark px-4 py-3 font-heading text-base uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] ${form.visibilidade === "PUBLICA" ? "bg-neo-yellow" : "bg-white"}`}
                        >
                          Publica
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Card className="bg-white p-4">
                      <p className="font-body text-xs font-black uppercase tracking-[0.14em] text-neo-dark/70">
                        Notas da casa sao sempre publicas para todos os moradores.
                      </p>
                    </Card>
                  )}
                </div>

                {error ? <ActionFeedback tone="error" message={error} /> : null}
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t-4 border-neo-dark pt-4 sm:mt-6 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={closeModal}>
                  Fechar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : editingNote ? "Salvar alteracoes" : "Salvar anotacao"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
