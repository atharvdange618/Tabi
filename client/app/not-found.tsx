import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-brand-cream flex items-center justify-center px-6 py-20">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-brand-lemon border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-2xl flex items-center justify-center mx-auto mb-6 font-kanji text-2xl">
          旅
        </div>
        <h1 className="font-display font-black text-3xl uppercase tracking-tight mb-2">
          Page Not Found
        </h1>
        <p className="text-[#6B7280] font-medium text-sm leading-relaxed mb-8">
          This page doesn&apos;t exist or has moved.
        </p>
        <Link href="/">
          <Button className="bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] hover:bg-brand-blue transition-all duration-150 h-auto px-5 py-2.5 rounded-lg text-sm">
            Go home
          </Button>
        </Link>
      </div>
    </main>
  );
}
