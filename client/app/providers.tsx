"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";
import { AuthSync } from "../lib/AuthSync";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <ClerkProvider>
      <AuthSync />
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              border: "2px solid #1A1A1A",
              boxShadow: "3px 3px 0px #1A1A1A",
              borderRadius: "0.5rem",
            },
          }}
        />
      </QueryClientProvider>
    </ClerkProvider>
  );
}
