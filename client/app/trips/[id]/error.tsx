"use client";

import { useEffect } from "react";
import { AlertOctagon, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TripError({
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
    <div className="h-full w-full flex items-center justify-center p-6 min-h-[50vh]">
      <div className="brutal-card rounded-xl p-8 max-w-md w-full bg-white text-center">
        <div className="w-12 h-12 bg-brand-coral/20 text-brand-coral rounded-xl border-2 border-brutal-border flex items-center justify-center mb-4 mx-auto rotate-3">
          <AlertOctagon size={24} />
        </div>
        <h2 className="text-xl font-bold font-display mb-2">Trip Error</h2>
        <p className="text-muted-foreground font-body text-sm mb-6">
          We couldn&apos;t load this part of your trip right now. Something went
          wrong!
        </p>
        <Button
          onClick={() => reset()}
          className="brutal-button bg-brand-mint hover:bg-brand-mint/90 text-foreground"
        >
          <RefreshCcw className="mr-2" size={16} />
          Reload View
        </Button>
      </div>
    </div>
  );
}
