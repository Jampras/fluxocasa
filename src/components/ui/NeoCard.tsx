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
        "relative overflow-hidden border-[3px] border-neo-dark bg-white p-4 shadow-[4px_4px_0_#0F172A] sm:border-4 sm:p-5 sm:shadow-[5px_5px_0_#0F172A] md:p-6 md:shadow-neo",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
