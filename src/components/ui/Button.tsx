import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

import { cx } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-neo-yellow text-neo-dark",
  secondary: "bg-neo-cream text-neo-dark",
  ghost: "bg-neo-cyan text-neo-dark"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", fullWidth = false, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cx(
        "neo-pressable mb-2 inline-flex h-11 items-center justify-center rounded-none border-[3px] border-neo-dark px-4 text-sm font-black uppercase tracking-[0.12em] shadow-[4px_4px_0_#0F172A] transform-gpu sm:h-12 sm:border-4 sm:px-5 sm:text-[0.95rem] md:h-12 md:px-6 md:tracking-[0.12em]",
        variantStyles[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    />
  );
});

