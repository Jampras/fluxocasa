import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, sharedMock } = vi.hoisted(() => ({
  prismaMock: {
    casa: {
      create: vi.fn(),
      findUnique: vi.fn()
    },
    morador: {
      update: vi.fn(),
      findMany: vi.fn()
    },
    contribuicao: {
      deleteMany: vi.fn()
    },
    $transaction: vi.fn()
  },
  sharedMock: {
    AUDIT_HOUSE_CREATED: "HOUSE_CREATED",
    AUDIT_MEMBER_JOINED: "MEMBER_JOINED",
    AUDIT_MEMBER_LEFT: "MEMBER_LEFT",
    AUDIT_INVITE_ROTATED: "INVITE_ROTATED",
    ROLE_ADMIN: "ADMIN",
    ROLE_MEMBER: "MEMBRO",
    RECORD_CONFIRMED: "CONFIRMADO",
    STATUS_PAID: "PAGA",
    createHouseAuditEntry: vi.fn(),
    ensureCurrentCycle: vi.fn(),
    ensureUserWithoutHouse: vi.fn(),
    getMonthLabel: vi.fn(),
    getMonthYear: vi.fn(() => ({ month: 3, year: 2026 })),
    getUserWithHouse: vi.fn(),
    initials: vi.fn(),
    mapHouseBill: vi.fn(),
    randomInviteCode: vi.fn(() => "FLUXO-ABCD"),
    requireHouseAdmin: vi.fn(),
    requireHouseMember: vi.fn(),
    roleToUi: vi.fn(),
    sumBy: vi.fn()
  }
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock
}));

vi.mock("./_shared", () => sharedMock);

import { houseRepository } from "./house.repository";

describe("houseRepository domain guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sharedMock.getMonthYear.mockReturnValue({ month: 3, year: 2026 });
  });

  it("impede criar casa quando o usuario ja participa de uma casa", async () => {
    sharedMock.ensureUserWithoutHouse.mockRejectedValue(
      new Error("Saia da casa atual antes de criar ou entrar em outra.")
    );

    await expect(houseRepository.createHouseForUser("user-1", { nome: "Apartamento 42" })).rejects.toThrow(
      "Saia da casa atual antes de criar ou entrar em outra."
    );

    expect(prismaMock.casa.create).not.toHaveBeenCalled();
  });

  it("impede entrar em outra casa quando o usuario ja esta vinculado", async () => {
    sharedMock.ensureUserWithoutHouse.mockRejectedValue(
      new Error("Saia da casa atual antes de criar ou entrar em outra.")
    );

    await expect(houseRepository.joinHouseByInviteCode("user-1", { codigoConvite: "FLUXO-ABCD" })).rejects.toThrow(
      "Saia da casa atual antes de criar ou entrar em outra."
    );

    expect(prismaMock.casa.findUnique).not.toHaveBeenCalled();
  });

  it("permite que um membro saia da casa limpando contribuicoes futuras", async () => {
    sharedMock.requireHouseMember.mockResolvedValue({
      id: "user-1",
      casaId: "house-1",
      role: "MEMBRO"
    });
    prismaMock.morador.findMany.mockResolvedValue([{ id: "user-1" }, { id: "user-2" }]);
    prismaMock.contribuicao.deleteMany.mockResolvedValue(undefined);
    prismaMock.morador.update.mockResolvedValue(undefined);
    prismaMock.$transaction.mockResolvedValue(undefined);

    const result = await houseRepository.leaveCurrentHouse("user-1");

    expect(result).toEqual({ action: "LEFT_HOUSE" });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(sharedMock.ensureCurrentCycle).toHaveBeenCalledWith("house-1", 3, 2026);
    expect(sharedMock.createHouseAuditEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        casaId: "house-1",
        type: "MEMBER_LEFT",
        actorResidentId: "user-1"
      })
    );
  });

  it("bloqueia a saida do administrador enquanto houver outros moradores", async () => {
    sharedMock.requireHouseMember.mockResolvedValue({
      id: "user-1",
      casaId: "house-1",
      role: "ADMIN"
    });
    prismaMock.morador.findMany.mockResolvedValue([{ id: "user-1" }, { id: "user-2" }]);

    await expect(houseRepository.leaveCurrentHouse("user-1")).rejects.toThrow(
      "Transfira a administracao antes de sair da casa."
    );
  });

  it("encerra a casa quando o administrador esta sozinho", async () => {
    const tx = {
      morador: {
        update: vi.fn().mockResolvedValue(undefined)
      },
      casa: {
        delete: vi.fn().mockResolvedValue(undefined)
      }
    };

    sharedMock.requireHouseMember.mockResolvedValue({
      id: "user-1",
      casaId: "house-1",
      role: "ADMIN"
    });
    prismaMock.morador.findMany.mockResolvedValue([{ id: "user-1" }]);
    prismaMock.$transaction.mockImplementation(async (callback: (value: typeof tx) => Promise<void>) => callback(tx));

    const result = await houseRepository.leaveCurrentHouse("user-1");

    expect(result).toEqual({ action: "HOUSE_DISSOLVED" });
    expect(tx.morador.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { casaId: null, role: "MEMBRO" }
    });
    expect(tx.casa.delete).toHaveBeenCalledWith({
      where: { id: "house-1" }
    });
  });
});
