"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      <div className="brutal-card rounded-2xl p-8 max-w-md w-full bg-white shadow-[8px_8px_0px_theme(--color-brutal-shadow)] text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-brand-coral/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-brand-lemon/20 rounded-full blur-2xl" />

        <div className="w-16 h-16 bg-brand-coral text-white rounded-2xl border-2 border-brutal-border flex items-center justify-center mb-6 mx-auto -rotate-3 hover:rotate-0 transition-transform">
          <AlertTriangle size={32} />
        </div>

        <h1 className="text-2xl font-bold font-display mb-3">
          Oops! Something went wrong
        </h1>
        <p className="text-muted-foreground font-body mb-8 text-sm">
          We encountered an unexpected error while trying to load this page.
          Don&apos;t worry, your data is safe.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="brutal-button bg-brand-blue hover:bg-brand-blue/90"
          >
            <RefreshCcw className="mr-2" size={16} />
            Try again
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-2 border-brutal-border hover:bg-brand-cream"
          >
            <Link href="/dashboard">
              <Home className="mr-2" size={16} />
              Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
