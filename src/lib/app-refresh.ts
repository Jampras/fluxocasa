"use client";

import { startTransition } from "react";

interface RouterLike {
  refresh(): void;
}

export function refreshCurrentView(
  router: RouterLike,
  _pathname: string,
  _searchParams: { toString(): string }
) {
  startTransition(() => {
    router.refresh();
  });
}
