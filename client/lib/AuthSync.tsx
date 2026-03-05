"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { setAuthTokenProvider } from "./axios";

/**
 * Syncs Clerk's getToken into the axios interceptor.
 * Must be rendered inside `<ClerkProvider>`.
 */
export function AuthSync() {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenProvider(getToken);
  }, [getToken]);

  return null;
}
