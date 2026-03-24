"use client";

import { startTransition } from "react";

interface RouterLike {
  refresh(): void;
  prefetch?(href: string): Promise<void> | void;
  replace?(href: string, options?: { scroll?: boolean }): void;
}

interface SearchParamsLike {
  toString(): string;
}

interface RefreshCurrentViewOptions {
  clearFocus?: boolean;
  delayMs?: number;
}

let scheduledRefreshHandle: number | null = null;
let scheduledHref: string | null = null;

function buildHref(pathname: string, searchParams: SearchParamsLike, clearFocus = false) {
  const nextSearchParams = new URLSearchParams(searchParams.toString());

  if (clearFocus) {
    nextSearchParams.delete("focus");
  }

  const queryString = nextSearchParams.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function refreshCurrentView(
  router: RouterLike,
  pathname: string,
  searchParams: SearchParamsLike,
  options: RefreshCurrentViewOptions = {}
) {
  const currentHref = buildHref(pathname, searchParams);
  const nextHref = buildHref(pathname, searchParams, options.clearFocus);

  if (typeof router.replace === "function" && nextHref !== currentHref) {
    router.replace(nextHref, { scroll: false });
  }

  if (typeof router.prefetch === "function") {
    void router.prefetch(nextHref);
  }

  if (scheduledRefreshHandle && scheduledHref === nextHref) {
    return;
  }

  if (scheduledRefreshHandle) {
    window.clearTimeout(scheduledRefreshHandle);
  }

  scheduledHref = nextHref;
  scheduledRefreshHandle = window.setTimeout(() => {
    scheduledRefreshHandle = null;
    scheduledHref = null;

    startTransition(() => {
      router.refresh();
    });
  }, options.delayMs ?? 90);
}
