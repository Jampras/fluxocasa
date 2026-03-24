import { clsx, type ClassValue } from "clsx";

export function cx(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function toCurrencyValue(cents: number) {
  return cents / 100;
}

export function toCents(value: number) {
  return Math.round(value * 100);
}

export function progressValue(spent: number, limit: number) {
  if (!limit) {
    return 0;
  }

  return Math.min((spent / limit) * 100, 100);
}

export function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}
