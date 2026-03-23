import { ReactNode, HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

interface NeoCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function NeoCard({ children, className, ...props }: NeoCardProps) {
  return (
    <div
      className={twMerge(
        "bg-white border-3 border-neo-dark shadow-neo p-6 relative overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
