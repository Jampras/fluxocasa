import { describe, expect, it, vi } from "vitest";

import { mapHouseBill, toBillStatus } from "./_shared";

describe("toBillStatus", () => {
  it("marks overdue unpaid bills as warning", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-23T12:00:00.000Z"));

    expect(toBillStatus("PENDENTE", new Date("2026-03-10T12:00:00.000Z"))).toBe("warning");

    vi.useRealTimers();
  });

  it("keeps bills due today as pending", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-23T12:00:00.000Z"));

    expect(toBillStatus("PENDENTE", new Date("2026-03-23T12:00:00.000Z"))).toBe("pending");

    vi.useRealTimers();
  });
});

describe("mapHouseBill", () => {
  it("maps overdue unpaid bills to the warning UI state", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-23T12:00:00.000Z"));

    const result = mapHouseBill({
      id: "bill-1",
      titulo: "Internet",
      categoria: "Utilidades",
      valorCentavos: 12000,
      vencimento: new Date("2026-03-10T12:00:00.000Z"),
      status: "PENDENTE",
      observacao: null
    });

    expect(result.status).toBe("warning");

    vi.useRealTimers();
  });
});
