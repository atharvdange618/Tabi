"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";
import { AuthSync } from "../lib/AuthSync";
import { useNotificationToasts } from "../hooks/useNotificationToasts";

const brutalShadow = "shadow-[3px_3px_0px_#1a1a1a]";

const clerkAppearance = {
  // Load Clerk's CSS into Tailwind's components layer so utilities override it.
  cssLayerName: "components",
  variables: {
    colorPrimary: "#93cdff",
    colorPrimaryForeground: "#111111",
    colorForeground: "#111111",
    colorMutedForeground: "#6b7280",
    colorBackground: "#ffffff",
    colorInput: "#ffffff",
    colorInputForeground: "#111111",
    colorBorder: "#1a1a1a",
    colorShadow: "#1a1a1a",
    fontFamily: "var(--font-dm-sans)",
    borderRadius: "0.5rem",
  },
  elements: {
    cardBox: "border-2 border-brutal-border shadow-[6px_6px_0px_#1a1a1a]",
    card: "shadow-none",
    headerTitle: "font-display text-xl font-bold",
    socialButtonsBlockButton: `border-2 border-brutal-border bg-white ${brutalShadow} transition-all hover:-translate-y-px hover:bg-brand-mint`,
    alternativeMethodsBlockButton: `border-2 border-brutal-border bg-white ${brutalShadow} transition-all hover:-translate-y-px hover:bg-brand-mint`,
    dividerLine: "h-0.5 bg-brutal-border",
    formFieldInput:
      "border-2 border-brutal-border shadow-none focus:shadow-[3px_3px_0px_#93cdff]",
    otpCodeFieldInput: "border-2 border-brutal-border",
    formButtonPrimary: `border-2 border-brutal-border bg-brand-blue text-[#111111] ${brutalShadow} transition-all after:hidden hover:-translate-y-px hover:bg-brand-blue hover:shadow-[4px_4px_0px_#1a1a1a] active:translate-y-px active:shadow-[1px_1px_0px_#1a1a1a]`,
    footer: "border-t-2 border-brutal-border bg-none bg-brand-cream",
    footerActionLink: "font-semibold text-[#111111] underline",
  },
};

function NotificationToastProvider() {
  useNotificationToasts();
  return null;
}

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
    <ClerkProvider
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <AuthSync />
      <QueryClientProvider client={queryClient}>
        <NotificationToastProvider />
        {children}
        <Toaster
          position="top-right"
          closeButton
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
