import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

import { cx } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, id, ...props },
  ref
) {
  const isNumber = props.type === "number";

  return (
    <label className="grid gap-2 text-sm font-medium text-neo-dark/75" htmlFor={id}>
      <span>{label}</span>
      <input
        ref={ref}
        id={id}
        className={cx(
          "neo-input-surface h-12 rounded-none border-4 border-neo-dark px-4 text-sm font-bold text-neo-dark outline-none transition-all placeholder:text-neo-dark/35 focus:bg-neo-yellow",
          className
        )}
        min={isNumber && props.min == null ? "0.01" : props.min}
        {...props}
      />
    </label>
  );
});

