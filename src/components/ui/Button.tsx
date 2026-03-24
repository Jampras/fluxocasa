import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

import { cx } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-dopamine-pink text-dopamine-dark shadow-push hover:brightness-110 active:translate-y-[6px] active:shadow-none",
  secondary: "bg-dopamine-yellow text-dopamine-dark shadow-push-yellow hover:brightness-110 active:translate-y-[6px] active:shadow-none",
  ghost: "bg-transparent text-dopamine-dark hover:bg-dopamine-pink/10 hover:text-dopamine-pink"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", fullWidth = false, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cx(
        "mb-2 inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-black uppercase tracking-[0.12em] transition-all duration-150 transform-gpu sm:h-[52px] sm:px-6 sm:text-base md:h-[56px] md:rounded-3xl md:px-8 md:tracking-wide",
        variantStyles[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    />
  );
});

