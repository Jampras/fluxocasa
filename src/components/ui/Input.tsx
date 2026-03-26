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
  return (
    <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-dopamine-dark/70" htmlFor={id}>
      <span>{label}</span>
      <input
        ref={ref}
        id={id}
        className={cx(
          "neo-input-surface h-14 rounded-2xl border-2 border-dopamine-pink/30 px-4 text-base font-bold text-dopamine-dark outline-none placeholder:text-dopamine-pink/40 focus:border-dopamine-pink focus:shadow-[0_0_0_4px_rgba(255,135,177,0.15)] transition-all",
          className
        )}
        {...props}
      />
    </label>
  );
});

