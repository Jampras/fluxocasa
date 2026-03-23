import * as React from "react";

type AsyncOrSyncFunction = (...args: any[]) => any;

type CacheFunction = <T extends AsyncOrSyncFunction>(fn: T) => T;

const fallbackCache: CacheFunction = <T extends AsyncOrSyncFunction>(fn: T) => fn;

export const safeCache: CacheFunction =
  typeof React.cache === "function" ? (React.cache as CacheFunction) : fallbackCache;
