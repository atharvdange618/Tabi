import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="max-w-[1100px] mx-auto py-20 px-6">
      <div className="cta-section py-10 px-6 sm:py-16 sm:px-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-8">
        <div>
          <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] tracking-tight text-[#111111] uppercase m-0 mb-3 text-balance">
            Your next trip
            <br />
            starts here.
          </h2>
          <p className="text-base text-gray-700 font-medium m-0 max-w-[400px] leading-relaxed">
            Free to create. Free to invite. No credit card. Just plan your trip
            and go.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/sign-up"
            className="brutal-btn bg-[#111111] text-[#FAFAF8] py-4 px-8 rounded-[10px] text-base no-underline border-2 border-[#111111] shadow-[4px_4px_0px_rgba(0,0,0,0.4)]"
          >
            Create your trip <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link
            href="/sign-in"
            className="brutal-btn bg-white text-[#111111] py-4 px-8 rounded-[10px] text-base no-underline border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] hover:bg-gray-50"
          >
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}
