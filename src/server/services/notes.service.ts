import { EscopoNota } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { NoteRecord, NotesBoardSnapshot } from "@/types";
import { UserFacingError } from "@/server/http/errors";

interface ResidentWithHouse {
  id: string;
  nome: string;
  casaId: string;
  casa: {
    id: string;
    nome: string;
  };
}

function formatMonthLabel(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatNoteDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short"
  }).format(date);
}

function formatNoteDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

async function requireResidentWithHouse(userId: string): Promise<ResidentWithHouse> {
  const resident = await prisma.morador.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nome: true,
      casaId: true,
      casa: {
        select: {
          id: true,
          nome: true
        }
      }
    }
  });

  if (!resident || !resident.casaId || !resident.casa) {
    throw new UserFacingError("Entre em uma casa para usar as anotacoes.", 403);
  }

  return {
    id: resident.id,
    nome: resident.nome,
    casaId: resident.casaId,
    casa: resident.casa
  };
}

function mapNote(
  note: {
    id: string;
    titulo: string;
    conteudo: string | null;
    tag: string | null;
    escopo: EscopoNota;
    isPublica: boolean;
    criadaEm: Date;
    atualizadaEm: Date;
    moradorId: string;
    morador: { nome: string };
  },
  currentUserId: string
): NoteRecord {
  const isHouse = note.escopo === EscopoNota.CASA;
  const isOwner = note.moradorId === currentUserId;

  return {
    id: note.id,
    title: note.titulo,
    content: note.conteudo?.trim() ?? "",
    tag: note.tag?.trim() || (isHouse ? "Casa" : "Pessoal"),
    scope: isHouse ? "house" : "personal",
    visibility: isHouse || note.isPublica ? "public" : "private",
    visibilityLabel: isHouse ? "Da casa" : note.isPublica ? "Pessoal publica" : "Pessoal privada",
    scopeLabel: isHouse ? "Casa" : "Pessoal",
    ownerName: note.morador.nome,
    createdAtLabel: formatNoteDate(note.criadaEm),
    updatedAtLabel:
      note.atualizadaEm.getTime() > note.criadaEm.getTime() + 60_000
        ? `Editada em ${formatNoteDateTime(note.atualizadaEm)}`
        : undefined,
    accentClass: isHouse ? "bg-neo-lime" : note.isPublica ? "bg-neo-yellow" : "bg-[#ffdbe8]",
    iconToneClass: isHouse ? "bg-[#d9ff90]" : note.isPublica ? "bg-[#fff2a8]" : "bg-[#ffc0d7]",
    canEdit: isHouse ? true : isOwner,
    canDelete: isHouse ? true : isOwner
  };
}

export async function getNotesBoardSnapshot(userId: string): Promise<NotesBoardSnapshot> {
  const resident = await requireResidentWithHouse(userId);
  const houseId = resident.casa.id;

  const notes = await prisma.nota.findMany({
    where: {
      casaId: houseId,
      OR: [
        { escopo: EscopoNota.CASA },
        { moradorId: userId },
        { escopo: EscopoNota.PESSOAL, isPublica: true }
      ]
    },
    orderBy: [{ posicao: "asc" }, { atualizadaEm: "desc" }],
    include: {
      morador: {
        select: {
          nome: true
        }
      }
    }
  });

  const mappedNotes = notes.map((note) => mapNote(note, userId));

  return {
    monthLabel: formatMonthLabel(),
    houseName: resident.casa.nome,
    noteCount: mappedNotes.length,
    visibleToHouseCount: mappedNotes.filter((note) => note.visibility === "public").length,
    privateCount: mappedNotes.filter((note) => note.visibility === "private").length,
    notes: mappedNotes
  };
}

export async function createNote(
  userId: string,
  input: {
    titulo: string;
    conteudo: string;
    tag: string;
    escopo: "PESSOAL" | "CASA";
    isPublica: boolean;
  }
) {
  const resident = await requireResidentWithHouse(userId);
  const houseId = resident.casa.id;
  const lastNote = await prisma.nota.findFirst({
    where: { casaId: houseId },
    orderBy: { posicao: "desc" },
    select: { posicao: true }
  });

  await prisma.nota.create({
    data: {
      titulo: input.titulo,
      conteudo: input.conteudo || null,
      tag: input.tag || null,
      escopo: input.escopo === "CASA" ? EscopoNota.CASA : EscopoNota.PESSOAL,
      isPublica: input.escopo === "CASA" ? true : input.isPublica,
      posicao: (lastNote?.posicao ?? 0) + 1,
      casaId: houseId,
      moradorId: resident.id
    }
  });
}

async function getAuthorizedNote(userId: string, noteId: string) {
  const resident = await requireResidentWithHouse(userId);
  const houseId = resident.casa.id;
  const note = await prisma.nota.findUnique({
    where: { id: noteId }
  });

  if (!note || note.casaId !== houseId) {
    throw new UserFacingError("Anotacao nao encontrada.", 404);
  }

  if (note.escopo === EscopoNota.PESSOAL && note.moradorId !== userId) {
    throw new UserFacingError("Voce nao pode editar esta anotacao.", 403);
  }

  return { resident, note };
}

export async function updateNote(
  userId: string,
  noteId: string,
  input: {
    titulo: string;
    conteudo: string;
    tag: string;
    escopo: "PESSOAL" | "CASA";
    isPublica: boolean;
  }
) {
  const { resident, note } = await getAuthorizedNote(userId, noteId);
  const houseId = resident.casa.id;

  await prisma.nota.update({
    where: { id: note.id },
    data: {
      titulo: input.titulo,
      conteudo: input.conteudo || null,
      tag: input.tag || null,
      escopo: input.escopo === "CASA" ? EscopoNota.CASA : EscopoNota.PESSOAL,
      isPublica: input.escopo === "CASA" ? true : input.isPublica,
      casaId: houseId,
      moradorId: input.escopo === "CASA" ? note.moradorId : userId
    }
  });
}

export async function deleteNote(userId: string, noteId: string) {
  const { note } = await getAuthorizedNote(userId, noteId);

  await prisma.nota.delete({
    where: { id: note.id }
  });
}
