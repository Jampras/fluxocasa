"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface NeoButtonProps extends Omit<HTMLMotionProps<"button">, "variant" | "size"> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "success" | "warning";
  size?: "sm" | "md" | "lg";
}

export function NeoButton({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: NeoButtonProps) {
  const baseClasses = "font-heading uppercase tracking-wide border-3 border-neo-dark transition-colors outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neo-dark active:shadow-none active:translate-y-[4px]";

  const variantClasses = {
    primary: "bg-neo-cyan text-neo-dark shadow-neo hover:bg-[#00D4EC]",
    secondary: "bg-white text-neo-dark shadow-neo hover:bg-gray-50",
    danger: "bg-neo-pink text-white shadow-neo hover:bg-[#E62577]",
    success: "bg-neo-lime text-neo-dark shadow-neo hover:bg-[#95E600]",
    warning: "bg-neo-yellow text-neo-dark shadow-neo hover:bg-[#E6D100]",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-xl",
    md: "px-6 py-3 text-2xl",
    lg: "px-8 py-4 text-3xl",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95, y: 4, boxShadow: "0px 0px 0px 0px rgba(15,23,42,1)" }}
      className={twMerge(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}
