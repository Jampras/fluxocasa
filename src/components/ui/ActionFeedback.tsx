import { cx } from "@/lib/utils";

export function ActionFeedback({
  tone,
  message,
  className
}: {
  tone: "success" | "error";
  message: string;
  className?: string;
}) {
  return (
    <p
      className={cx(
        "rounded-none border-[3px] px-3 py-2 text-sm font-semibold shadow-[4px_4px_0_#0F172A] sm:border-4",
        tone === "success"
          ? "border-emerald-900 bg-emerald-200 text-emerald-950"
          : "border-rose-900 bg-rose-200 text-rose-950",
        className
      )}
    >
      {message}
    </p>
  );
}
