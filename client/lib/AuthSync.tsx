"use client";

import { useAuth } from "@clerk/nextjs";
import { setAuthTokenProvider } from "./axios";

/**
 * Syncs Clerk's getToken into the axios interceptor.
 * Must be rendered inside `<ClerkProvider>`.
 */
export function AuthSync() {
  const { getToken } = useAuth();

  setAuthTokenProvider(getToken);

  return null;
}
