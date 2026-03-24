import { beforeEach, describe, expect, it, vi } from "vitest";
import { EscopoTransacao, FrequenciaTransacao, TipoTransacao } from "@prisma/client";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    transacao: {
      findMany: vi.fn(),
      create: vi.fn()
    }
  }
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock
}));

vi.mock("@/lib/safe-cache", () => ({
  safeCache: <TArgs extends unknown[], TResult>(fn: (...args: TArgs) => TResult) => fn
}));

import {
  ensureHouseRecurringTransactions,
  ensurePersonalRecurringTransactions
} from "./_recurrence";

describe("recurrence guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("cria ocorrencias mensais pendentes ate o mes atual", async () => {
    prismaMock.transacao.findMany.mockResolvedValue([
      {
        id: "txn-jan",
        serieId: "serie-1",
        titulo: "Internet",
        valorCentavos: 12000,
        categoria: "Utilidades",
        dataVencimento: new Date("2026-01-10T12:00:00.000Z"),
        observacao: null,
        escopo: EscopoTransacao.PESSOAL,
        tipo: TipoTransacao.DESPESA,
        frequencia: FrequenciaTransacao.MENSAL,
        parcelaAtual: null,
        parcelasTotais: null,
        moradorId: "user-1",
        casaId: null,
        status: "PENDENTE",
        dataPagamento: null,
        criadaEm: new Date("2026-01-01T12:00:00.000Z")
      }
    ]);
    prismaMock.transacao.create
      .mockResolvedValueOnce({
        id: "txn-feb",
        serieId: "serie-1",
        titulo: "Internet",
        valorCentavos: 12000,
        categoria: "Utilidades",
        dataVencimento: new Date("2026-02-10T12:00:00.000Z"),
        observacao: null,
        escopo: EscopoTransacao.PESSOAL,
        tipo: TipoTransacao.DESPESA,
        frequencia: FrequenciaTransacao.MENSAL,
        parcelaAtual: null,
        parcelasTotais: null,
        moradorId: "user-1",
        casaId: null,
        status: "PENDENTE",
        dataPagamento: null,
        criadaEm: new Date("2026-02-01T12:00:00.000Z")
      })
      .mockResolvedValueOnce({
        id: "txn-mar",
        serieId: "serie-1",
        titulo: "Internet",
        valorCentavos: 12000,
        categoria: "Utilidades",
        dataVencimento: new Date("2026-03-10T12:00:00.000Z"),
        observacao: null,
        escopo: EscopoTransacao.PESSOAL,
        tipo: TipoTransacao.DESPESA,
        frequencia: FrequenciaTransacao.MENSAL,
        parcelaAtual: null,
        parcelasTotais: null,
        moradorId: "user-1",
        casaId: null,
        status: "PENDENTE",
        dataPagamento: null,
        criadaEm: new Date("2026-03-01T12:00:00.000Z")
      });

    await ensurePersonalRecurringTransactions("user-1");

    expect(prismaMock.transacao.create).toHaveBeenCalledTimes(2);
    expect(prismaMock.transacao.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        dataVencimento: new Date("2026-02-10T12:00:00.000Z"),
        status: "PENDENTE"
      })
    });
    expect(prismaMock.transacao.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        dataVencimento: new Date("2026-03-10T12:00:00.000Z"),
        status: "PENDENTE"
      })
    });
  });

  it("nao cria parcela nova quando a serie parcelada ja terminou", async () => {
    prismaMock.transacao.findMany.mockResolvedValue([
      {
        id: "installment-last",
        serieId: "serie-2",
        titulo: "Notebook",
        valorCentavos: 30000,
        categoria: "Tecnologia",
        dataVencimento: new Date("2026-01-15T12:00:00.000Z"),
        observacao: null,
        escopo: EscopoTransacao.PESSOAL,
        tipo: TipoTransacao.DESPESA,
        frequencia: FrequenciaTransacao.PARCELADA,
        parcelaAtual: 3,
        parcelasTotais: 3,
        moradorId: "user-1",
        casaId: null,
        status: "PENDENTE",
        dataPagamento: null,
        criadaEm: new Date("2026-01-01T12:00:00.000Z")
      }
    ]);

    await ensurePersonalRecurringTransactions("user-1");

    expect(prismaMock.transacao.create).not.toHaveBeenCalled();
  });

  it("nao duplica um mes que ja existe na serie recorrente da casa", async () => {
    prismaMock.transacao.findMany.mockResolvedValue([
      {
        id: "house-jan",
        serieId: "serie-3",
        titulo: "Aluguel",
        valorCentavos: 180000,
        categoria: "Moradia",
        dataVencimento: new Date("2026-01-05T12:00:00.000Z"),
        observacao: null,
        escopo: EscopoTransacao.CASA,
        tipo: TipoTransacao.DESPESA,
        frequencia: FrequenciaTransacao.MENSAL,
        parcelaAtual: null,
        parcelasTotais: null,
        moradorId: "user-1",
        casaId: "house-1",
        status: "PENDENTE",
        dataPagamento: null,
        criadaEm: new Date("2026-01-01T12:00:00.000Z")
      },
      {
        id: "house-feb",
        serieId: "serie-3",
        titulo: "Aluguel",
        valorCentavos: 180000,
        categoria: "Moradia",
        dataVencimento: new Date("2026-02-05T12:00:00.000Z"),
        observacao: null,
        escopo: EscopoTransacao.CASA,
        tipo: TipoTransacao.DESPESA,
        frequencia: FrequenciaTransacao.MENSAL,
        parcelaAtual: null,
        parcelasTotais: null,
        moradorId: "user-1",
        casaId: "house-1",
        status: "PENDENTE",
        dataPagamento: null,
        criadaEm: new Date("2026-02-01T12:00:00.000Z")
      }
    ]);
    prismaMock.transacao.create.mockResolvedValue({
      id: "house-mar",
      serieId: "serie-3",
      titulo: "Aluguel",
      valorCentavos: 180000,
      categoria: "Moradia",
      dataVencimento: new Date("2026-03-05T12:00:00.000Z"),
      observacao: null,
      escopo: EscopoTransacao.CASA,
      tipo: TipoTransacao.DESPESA,
      frequencia: FrequenciaTransacao.MENSAL,
      parcelaAtual: null,
      parcelasTotais: null,
      moradorId: "user-1",
      casaId: "house-1",
      status: "PENDENTE",
      dataPagamento: null,
      criadaEm: new Date("2026-03-01T12:00:00.000Z")
    });

    await ensureHouseRecurringTransactions("house-1");

    expect(prismaMock.transacao.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.transacao.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dataVencimento: new Date("2026-03-05T12:00:00.000Z"),
        casaId: "house-1"
      })
    });
  });
});
