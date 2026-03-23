"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/Input";

type ApiRecurrence = "UNICA" | "MENSAL" | "PARCELADA" | "FIXA";

const recurrenceLabels: Record<ApiRecurrence, string> = {
  UNICA: "Unica",
  MENSAL: "Mensal",
  PARCELADA: "Parcelada",
  FIXA: "Fixa"
};

export function RecurrenceFields({
  defaultFrequency = "UNICA",
  defaultInstallments,
  installmentsLabel = "Parcelas"
}: {
  defaultFrequency?: ApiRecurrence;
  defaultInstallments?: number;
  installmentsLabel?: string;
}) {
  const [frequency, setFrequency] = useState<ApiRecurrence>(defaultFrequency);

  useEffect(() => {
    setFrequency(defaultFrequency);
  }, [defaultFrequency]);

  return (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-neo-dark/75">
        <span>Recorrencia</span>
        <select
          name="frequencia"
          value={frequency}
          onChange={(event) => {
            setFrequency(event.target.value as ApiRecurrence);
          }}
          className="h-12 rounded-none border-4 border-neo-dark bg-neo-bg px-4 text-sm text-neo-dark"
        >
          {Object.entries(recurrenceLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {frequency === "PARCELADA" ? (
        <Input
          id={`${installmentsLabel}-parcelas`}
          name="parcelasTotais"
          label={installmentsLabel}
          type="number"
          min={2}
          step="1"
          defaultValue={defaultInstallments}
        />
      ) : null}
    </div>
  );
}
