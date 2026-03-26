"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { NeoCard } from "@/components/ui/NeoCard";

interface DashboardMetricItem {
  label: string;
  value: string;
  description: string;
  accentClass: string;
}

export function DashboardMetricCarousel({ items }: { items: DashboardMetricItem[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(items.length > 1);

  const updateScrollState = useMemo(
    () => () => {
      const container = containerRef.current;

      if (!container) {
        return;
      }

      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      setCanScrollLeft(container.scrollLeft > 8);
      setCanScrollRight(container.scrollLeft < maxScrollLeft - 8);
    },
    []
  );

  useEffect(() => {
    updateScrollState();

    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  function scrollByDirection(direction: "left" | "right") {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const firstCard = container.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard?.getBoundingClientRect().width ?? container.clientWidth * 0.52;
    const amount = Math.max(cardWidth + 20, 260);
    container.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth"
    });
  }

  const navButtonBaseClass =
    "neo-pressable pointer-events-auto flex h-12 w-12 items-center justify-center border-4 border-neo-dark text-neo-dark shadow-[4px_4px_0_#0F172A] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0";

  return (
    <div className="relative">
      <div className="compact-desktop-tight mb-3 flex items-center justify-between gap-3 xl:mb-4">
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-neo-dark/60 sm:text-sm sm:tracking-[0.16em]">
          Deslize no touch ou use as setas no desktop.
        </p>
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollByDirection("left")}
            disabled={!canScrollLeft}
            className={`${navButtonBaseClass} bg-white`}
            aria-label="Ver cards anteriores"
          >
            <ChevronLeft className="h-6 w-6 stroke-[3px]" />
          </button>
          <button
            type="button"
            onClick={() => scrollByDirection("right")}
            disabled={!canScrollRight}
            className={`${navButtonBaseClass} bg-neo-yellow`}
            aria-label="Ver proximos cards"
          >
            <ChevronRight className="h-6 w-6 stroke-[3px]" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          className="compact-desktop-tight flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 pr-2 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] touch-pan-x sm:gap-4 xl:gap-5"
        >
          {items.map((item) => (
            <NeoCard
              key={item.label}
              className="min-h-[220px] min-w-[88%] snap-start overflow-hidden bg-white p-0 sm:min-h-[236px] sm:min-w-[68%] lg:min-h-[250px] lg:min-w-[calc(50%-10px)] xl:min-h-[270px] xl:min-w-[calc(50%-10px)] 2xl:min-h-[300px]"
            >
              <div className={`border-b-[3px] border-neo-dark px-3 py-2 sm:border-b-4 sm:px-4 sm:py-3 xl:px-5 xl:py-4 ${item.accentClass}`}>
                <p className="font-heading text-[10px] uppercase tracking-[0.14em] text-neo-dark sm:text-sm sm:tracking-[0.22em] xl:text-base">
                  {item.label}
                </p>
              </div>
              <div className="flex h-[calc(100%-56px)] flex-col justify-between space-y-3 p-4 sm:p-5 xl:p-6">
                <h2 className="font-heading text-[2.5rem] uppercase leading-none text-neo-dark sm:text-[3rem] xl:text-[3.6rem] 2xl:text-[4rem]">
                  {item.value}
                </h2>
                <p className="max-w-[18rem] font-body text-[11px] font-bold uppercase tracking-[0.08em] text-neo-dark/65 sm:text-sm sm:tracking-[0.12em] xl:max-w-[20rem] xl:text-[0.95rem]">
                  {item.description}
                </p>
              </div>
            </NeoCard>
          ))}
        </div>
      </div>
    </div>
  );
}
