import { X } from "lucide-react";

import { cx } from "@/lib/utils";

export function ActionFeedback({
  tone,
  message,
  onDismiss,
  className
}: {
  tone: "success" | "error";
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "neo-pop-in flex items-start justify-between gap-3 rounded-none border-[3px] px-3 py-2 text-sm font-black uppercase tracking-[0.08em] shadow-[4px_4px_0_#0F172A] sm:border-4 sm:px-4 sm:py-3",
        tone === "success"
          ? "border-emerald-900 bg-[linear-gradient(135deg,#b7ff35_0%,#f7ffbc_100%)] text-emerald-950"
          : "border-rose-900 bg-[linear-gradient(135deg,#ff2a85_0%,#f7c8d9_100%)] text-neo-dark",
        className
      )}
    >
      <div className="min-w-0">
        <span className="mr-2 inline-block border-[3px] border-current bg-neo-cream px-2 py-0.5 font-heading text-[10px] tracking-[0.16em] sm:text-xs">
          {tone === "success" ? "LEVEL UP" : "ATENCAO"}
        </span>
        <span className="break-words">{message}</span>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="neo-pressable shrink-0 border-[3px] border-current bg-neo-cream/80 p-1 text-current sm:border-4"
          aria-label="Dispensar aviso"
        >
          <X className="h-4 w-4 stroke-[3px]" />
        </button>
      ) : null}
    </div>
  );
}
