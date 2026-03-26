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
  secondary: "bg-white text-neo-dark",
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
        "neo-pressable mb-2 inline-flex h-12 items-center justify-center rounded-none border-[3px] border-neo-dark px-5 text-sm font-black uppercase tracking-[0.12em] shadow-[4px_4px_0_#0F172A] transform-gpu sm:h-[52px] sm:border-4 sm:px-6 sm:text-base md:h-[56px] md:px-8 md:tracking-wide",
        variantStyles[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    />
  );
});

