import { describe, it, expect } from "vitest";
import { cx, formatCurrency, toCurrencyValue, toCents, progressValue } from "@/lib/utils";

describe("cx", () => {
  it("joins class names", () => {
    expect(cx("a", "b")).toBe("a b");
  });
  it("filters falsy values", () => {
    expect(cx("a", false && "b", "c")).toBe("a c");
  });
  it("returns empty string for no input", () => {
    expect(cx()).toBe("");
  });
});

describe("formatCurrency", () => {
  it("formats positive values in BRL", () => {
    const result = formatCurrency(1500);
    expect(result).toContain("1.500");
    expect(result).toContain("R$");
  });
  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0,00");
  });
  it("formats decimal values", () => {
    const result = formatCurrency(99.9);
    expect(result).toContain("99,90");
  });
});

describe("toCurrencyValue", () => {
  it("converts cents to currency", () => {
    expect(toCurrencyValue(1500)).toBe(15);
    expect(toCurrencyValue(100)).toBe(1);
    expect(toCurrencyValue(0)).toBe(0);
  });
});

describe("toCents", () => {
  it("converts currency to cents", () => {
    expect(toCents(15)).toBe(1500);
    expect(toCents(1)).toBe(100);
    expect(toCents(0)).toBe(0);
  });
  it("rounds floating point", () => {
    expect(toCents(10.555)).toBe(1056);
  });
});

describe("progressValue", () => {
  it("calculates correct percentage", () => {
    expect(progressValue(50, 100)).toBe(50);
    expect(progressValue(75, 100)).toBe(75);
  });
  it("caps at 100%", () => {
    expect(progressValue(150, 100)).toBe(100);
  });
  it("returns 0 when limit is 0", () => {
    expect(progressValue(50, 0)).toBe(0);
  });
});
