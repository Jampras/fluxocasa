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
        "relative overflow-hidden border-[3px] border-neo-dark bg-[linear-gradient(180deg,rgba(248,234,208,0.99)_0%,rgba(238,218,186,0.99)_100%)] p-4 shadow-[4px_4px_0_#0F172A] transition-transform duration-150 hover:-translate-y-1 sm:border-4 sm:p-4 sm:shadow-[5px_5px_0_#0F172A] md:p-5 md:shadow-neo",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
