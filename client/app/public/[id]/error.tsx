"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Lock, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicTripError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isPrivate =
    error?.message?.toLowerCase().includes("publicly accessible") ||
    error?.message?.toLowerCase().includes("forbidden") ||
    error?.message?.toLowerCase().includes("403");

  if (isPrivate) {
    return (
      <div className="min-h-screen bg-brand-cream font-body text-[#111] flex flex-col">
        <nav className="sticky top-0 z-50 h-14 bg-white border-b-2 border-[#1A1A1A] flex items-center px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-brand-blue border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] rounded-md flex items-center justify-center font-kanji text-sm group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[4px_4px_0px_#1A1A1A] transition-all duration-150">
              旅
            </div>
            <span className="font-display font-black text-base tracking-tight">
              tabi
            </span>
          </Link>
        </nav>
        <div className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-brand-lemon border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock size={24} />
            </div>
            <h1 className="font-display font-black text-3xl uppercase tracking-tight mb-2">
              Private Trip
            </h1>
            <p className="text-[#6B7280] font-medium text-sm leading-relaxed mb-8">
              This trip is not publicly accessible. The owner hasn&apos;t shared
              it publicly yet.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/sign-in">
                <Button className="bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] hover:bg-brand-blue transition-all duration-150 h-auto px-5 py-2.5 rounded-lg text-sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] transition-all duration-150 h-auto px-5 py-2.5 rounded-lg text-sm"
                >
                  Go home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream font-body text-[#111] flex flex-col">
      <nav className="sticky top-0 z-50 h-14 bg-white border-b-2 border-[#1A1A1A] flex items-center px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-brand-blue border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] rounded-md flex items-center justify-center font-kanji text-sm group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[4px_4px_0px_#1A1A1A] transition-all duration-150">
            旅
          </div>
          <span className="font-display font-black text-base tracking-tight">
            tabi
          </span>
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-brand-peach border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Home size={24} />
          </div>
          <h1 className="font-display font-black text-3xl uppercase tracking-tight mb-2">
            Couldn&apos;t load trip
          </h1>
          <p className="text-[#6B7280] font-medium text-sm leading-relaxed mb-8">
            Something went wrong while loading this itinerary. Please try again
            or head back home.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => reset()}
              className="bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] hover:bg-brand-blue transition-all duration-150 h-auto px-5 py-2.5 rounded-lg text-sm"
            >
              Try again
            </Button>
            <Link href="/">
              <Button
                variant="outline"
                className="border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] transition-all duration-150 h-auto px-5 py-2.5 rounded-lg text-sm"
              >
                Go home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
