"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getPublicEnv } from "@/config/env";

export function getSupabaseBrowserClient() {
  const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey } = getPublicEnv();

  if (!url || !anonKey) {
    return null;
  }

  return createBrowserClient(url, anonKey);
}
