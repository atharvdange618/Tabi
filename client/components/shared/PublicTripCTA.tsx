"use client";

import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function PublicTripCTA() {
  const { isSignedIn } = useUser();

  return (
    <div className="border-t-2 border-[#1A1A1A] bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="font-kanji text-4xl mb-4">旅</div>
        {isSignedIn ? (
          <>
            <h2 className="font-display font-black text-3xl uppercase tracking-tight mb-3">
              Back to planning?
            </h2>
            <p className="text-[#6B7280] font-medium text-base mb-8 max-w-md mx-auto">
              Head to your dashboard to continue working on your own trips.
            </p>
            <Link href="/dashboard">
              <Button className="bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] hover:bg-brand-blue active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#1A1A1A] transition-all duration-150 h-auto px-6 py-3 rounded-lg gap-2">
                <LayoutDashboard size={16} /> Go to dashboard
              </Button>
            </Link>
          </>
        ) : (
          <>
            <h2 className="font-display font-black text-3xl uppercase tracking-tight mb-3">
              Planning a trip?
            </h2>
            <p className="text-[#6B7280] font-medium text-base mb-8 max-w-md mx-auto">
              Build your own itinerary with Tabi. Invite your crew, split
              expenses, and plan together in real time for free.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/sign-up">
                <Button className="bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] hover:bg-brand-blue active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#1A1A1A] transition-all duration-150 h-auto px-6 py-3 rounded-lg gap-2">
                  Start planning for free <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] transition-all duration-150 h-auto px-6 py-3 rounded-lg"
                >
                  Learn more
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
