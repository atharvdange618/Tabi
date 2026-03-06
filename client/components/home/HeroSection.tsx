import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  PlusCircle,
  BadgeIndianRupee,
} from "lucide-react";

export function HeroSection() {
  return (
    <section className="hero-grid max-w-[1200px] mx-auto pt-20 pb-[100px] px-6">
      <div className="flex flex-row items-center justify-between gap-12 flex-wrap">
        <div className="flex-1 min-w-[300px] max-w-[540px]">
          <div className="anim-1">
            <span className="badge tag-rotate-1 inline-flex bg-[#FFF3B0] mb-6">
              Shared group workspace
            </span>
          </div>

          <h1 className="anim-2 font-display font-extrabold text-[clamp(48px,6vw,76px)] leading-[1.05] tracking-tight text-[#111111] uppercase mb-6 relative text-balance">
            Plan Trips.{" "}
            <span
              className="text-transparent"
              style={{ WebkitTextStroke: "2px #111" }}
            >
              Together.
            </span>{" "}
            <span className="text-[#93CDFF]">Always.</span>
          </h1>

          <p className="anim-3 text-lg text-gray-500 leading-relaxed max-w-[460px] mb-9 font-medium">
            Tabi brings your whole group onto one shared itinerary. Build day
            plans, split expenses, store files all in one place, no WhatsApp groups
            required.
          </p>

          <div className="anim-4 flex gap-3 flex-wrap">
            <Link
              href="/sign-up"
              className="brutal-btn bg-[#93CDFF] py-3.5 px-7 rounded-[10px] text-base no-underline text-[#111111]"
            >
              Start your trip <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              href="/sign-in"
              className="brutal-btn bg-white py-3.5 px-7 rounded-[10px] text-base no-underline text-[#111111]"
            >
              View dashboard
            </Link>
          </div>

          <div className="anim-5 flex items-center gap-4 mt-8 flex-wrap">
            {[
              "Free to start",
              "No credit card",
              "Invite unlimited friends",
            ].map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500"
              >
                <CheckCircle2
                  size={14}
                  className="text-green-500"
                  aria-hidden="true"
                />
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-[300px] max-w-[480px] relative h-[440px]">
          <div className="float-card-reverse absolute top-5 right-0 w-[260px] bg-[#FFD6C0] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl p-4 -rotate-2 z-10">
            <div className="flex items-center gap-2 mb-3">
              <BadgeIndianRupee
                size={16}
                className="text-[#111]"
                aria-hidden="true"
              />
              <span className="font-bold text-[13px] font-display">
                Trip Budget
              </span>
              <span className="ml-auto text-xs font-semibold text-gray-500">
                ¥180,000
              </span>
            </div>
            {[
              { label: "Flights", pct: 55, color: "bg-[#93CDFF]" },
              { label: "Hotels", pct: 30, color: "bg-[#B8F0D4]" },
              { label: "Food", pct: 15, color: "bg-[#FFF3B0]" },
            ].map((bar) => (
              <div key={bar.label} className="mb-2">
                <div className="flex justify-between text-[11px] font-semibold mb-1 text-[#111]">
                  <span>{bar.label}</span>
                  <span>{bar.pct}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full border border-[#1A1A1A] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${bar.color}`}
                    style={{ width: `${bar.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="float-card absolute top-[60px] left-0 w-[300px] bg-white border-2 border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] rounded-[14px] p-5 z-20">
            <div className="bg-[#93CDFF] border-2 border-[#1A1A1A] rounded-[10px] py-3.5 px-4 mb-4 flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#FFF3B0] border-2 border-[#1A1A1A] rounded-lg flex items-center justify-center shrink-0">
                <MapPin size={18} className="text-[#111]" aria-hidden="true" />
              </div>
              <div>
                <div className="font-bold text-sm font-display">
                  Kyoto Explorer
                </div>
                <div className="text-[11px] text-gray-500 font-medium">
                  Oct 12 – Oct 20 · 4 members
                </div>
              </div>
            </div>

            <div className="mb-2">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                Day 1 · Oct 12
              </div>
              {[
                {
                  label: "Fushimi Inari Taisha",
                  time: "9:00 AM",
                  color: "bg-[#B8F0D4]",
                },
                {
                  label: "Nishiki Market",
                  time: "12:30 PM",
                  color: "bg-[#FFF3B0]",
                },
                {
                  label: "Gion District Walk",
                  time: "4:00 PM",
                  color: "bg-[#FFD6C0]",
                },
              ].map((act) => (
                <div
                  key={act.label}
                  className="flex items-center gap-2 py-2 px-2.5 bg-[#FAFAF8] border-[1.5px] border-[#1A1A1A] rounded-lg mb-[5px]"
                >
                  <div
                    className={`w-2 h-2 rounded-full border-[1.5px] border-[#1A1A1A] shrink-0 ${act.color}`}
                  />
                  <span className="text-xs font-semibold flex-1">
                    {act.label}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {act.time}
                  </span>
                </div>
              ))}
            </div>

            <button
              className="w-full p-2 border-[1.5px] border-dashed border-[#1A1A1A] rounded-lg bg-transparent flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 cursor-pointer"
              aria-label="Add activity"
            >
              <PlusCircle size={12} aria-hidden="true" />
              Add activity
            </button>
          </div>

          <div className="absolute bottom-5 right-5 bg-white border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] rounded-lg py-2.5 px-3.5 flex items-center gap-2 z-30">
            <div className="flex">
              {[
                "bg-[#93CDFF]",
                "bg-[#FFD6C0]",
                "bg-[#B8F0D4]",
                "bg-[#FFF3B0]",
              ].map((bgClass, i) => (
                <div
                  key={bgClass}
                  className={`w-[22px] h-[22px] rounded-full border-2 border-[#1A1A1A] ${bgClass} ${i === 0 ? "" : "-ml-1.5"}`}
                />
              ))}
            </div>
            <div>
              <div className="text-[11px] font-bold">4 members</div>
              <span className="text-[10px] text-gray-500 font-medium">
                collaborating
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
