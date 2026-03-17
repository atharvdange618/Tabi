import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Eye,
  Lock,
  Trash2,
  Bell,
  Globe,
} from "lucide-react";
import { HomeFooter } from "@/components/home/HomeFooter";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How Tabi handles your data. Short version: we collect what we need, we don't sell it, and you're in control.",
};

const sections = [
  {
    icon: <Eye size={20} color="#111" />,
    iconBg: "#93CDFF",
    title: "What we collect",
    content: [
      {
        subtitle: "Account information",
        text: "When you sign up via Clerk, we receive your name, email address, and profile photo. We store these in our own database to associate you with your trips and activities inside Tabi.",
      },
      {
        subtitle: "Trip data",
        text: "Everything you create inside Tabi   trips, itineraries, activities, expenses, checklists, reservations, comments   is stored in our MongoDB database and linked to your account.",
      },
      {
        subtitle: "Uploaded files",
        text: "Files you upload (flight tickets, hotel confirmations, etc.) are stored on Cloudinary. We store the resulting URL and metadata in our database.",
      },
      {
        subtitle: "Usage data",
        text: "Standard server logs   IP address, browser type, pages visited, timestamps. We use this to keep the service running and to debug issues. We do not build ad profiles from this.",
      },
    ],
  },
  {
    icon: <Lock size={20} color="#111" />,
    iconBg: "#B8F0D4",
    title: "How we use it",
    content: [
      {
        subtitle: "To run the product",
        text: "Your data powers your experience   showing your trips, syncing with collaborators in real time, calculating budget splits, storing your files. That's the primary use.",
      },
      {
        subtitle: "To send you notifications",
        text: "We use your email to send you notifications (invite accepted, new comment, etc.).",
      },
      {
        subtitle: "To improve Tabi",
        text: "Aggregate, anonymized usage patterns help us understand which features people actually use. We never analyse individual behaviour to serve you ads.",
      },
    ],
  },
  {
    icon: <Globe size={20} color="#111" />,
    iconBg: "#FFD6C0",
    title: "Who we share it with",
    content: [
      {
        subtitle: "Your trip collaborators",
        text: "When you invite someone to a trip, they can see your name, photo, and activity within that trip. You control who you invite.",
      },
      {
        subtitle: "Service providers",
        text: "We use Clerk (auth), MongoDB Atlas (database), Cloudinary (file storage), and Hostinger (hosting). These are processors, not data buyers   they operate under their own privacy policies and only process what's necessary.",
      },
      {
        subtitle: "Legal requirements",
        text: "We'll share data if required by law, a court order, or to protect the safety of our users. We'll tell you if we can.",
      },
      {
        subtitle: "Nobody else",
        text: "We don't sell your data. We don't share it with advertisers. We don't broker it. Full stop.",
      },
    ],
  },
  {
    icon: <Bell size={20} color="#111" />,
    iconBg: "#FFF3B0",
    title: "Cookies & tracking",
    content: [
      {
        subtitle: "Session cookies",
        text: "Clerk uses cookies to keep you logged in. These are strictly necessary and disappear when you log out or your session expires.",
      },
      {
        subtitle: "No third-party trackers",
        text: "We don't run Google Analytics, Meta Pixel, or any third-party tracking script. If that changes, we'll update this page and let you know.",
      },
    ],
  },
  {
    icon: <Trash2 size={20} color="#111" />,
    iconBg: "#FFB8B8",
    title: "Your rights",
    content: [
      {
        subtitle: "Access",
        text: "You can view all the data tied to your account inside Tabi at any time.",
      },
      {
        subtitle: "Deletion",
        text: "You can send an email to atharvdange.dev@proton.me and we'll remove your personal data from our systems within 30 days. Trip data you created may remain in anonymized form if other members have a legitimate need for it.",
      },
      {
        subtitle: "Export",
        text: "Want your data? Reach out and we'll put together an export. We're a small team so give us a few days.",
      },
      {
        subtitle: "Corrections",
        text: "Your name and photo come from your social accounts update them there and the change propagates to Tabi automatically.",
      },
    ],
  },
  {
    icon: <Shield size={20} color="#111" />,
    iconBg: "#93CDFF",
    title: "Security",
    content: [
      {
        subtitle: "Auth",
        text: "Authentication is handled entirely by Clerk, which uses industry-standard JWT sessions with automatic rotation. We never store passwords.",
      },
      {
        subtitle: "Transport",
        text: "All traffic between your browser and our servers runs over HTTPS. Data at rest is encrypted by MongoDB Atlas and Cloudinary.",
      },
      {
        subtitle: "Access control",
        text: "Every API route on our backend requires a valid Clerk session token. Trip data is gated by role   if you're not a member of a trip, you can't access it.",
      },
    ],
  },
];

const tldr = [
  "We collect what's needed to run Tabi. Nothing more.",
  "We don't sell your data. Not to anyone, ever.",
  "Auth is handled by Clerk. We never touch your password.",
  "We don't run third-party trackers or ad scripts.",
];

export default function PrivacyPage() {
  return (
    <div className="bg-[#FAFAF8] min-h-screen text-[#111111] font-body selection:bg-[#93CDFF] selection:text-black">
      <nav className="bg-white border-b-2 border-[#1A1A1A] px-6 h-16 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="bg-[#93CDFF] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] rounded-md w-7 h-7 flex items-center justify-center text-sm text-[#111111] font-kanji">
            旅
          </div>
          <span className="font-display font-extrabold text-lg text-[#111111] tracking-[-0.02em]">
            tabi
          </span>
        </Link>
        <Link
          href="/"
          className="bg-[#FAFAF8] px-4 py-2 rounded-lg text-[13px] font-bold text-[#111] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] transition-all flex items-center gap-2"
        >
          <ArrowLeft size={14} /> Back to home
        </Link>
      </nav>

      <div className="max-w-[1100px] mx-auto px-6 pt-16 pb-24 flex gap-12 items-start flex-col md:flex-row">
        <aside className="w-full md:w-60 shrink-0 md:sticky md:top-24 order-2 md:order-1">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both">
            <div className="bg-white rounded-xl p-5 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                On this page
              </div>
              <div className="flex flex-col gap-1">
                {sections.map((s) => (
                  <a
                    key={s.title}
                    href={`#${s.title.toLowerCase().replace(/\s+/g, "-")}`}
                    className="flex items-center gap-2 mt-1 py-2 px-3 rounded-lg text-[13px] font-bold text-[#111] tracking-tight transition-colors border-2 border-transparent hover:bg-[#FAFAF8] hover:border-[#1A1A1A]"
                  >
                    <span
                      className="w-5 h-5 border-[1.5px] border-[#1A1A1A] rounded flex items-center justify-center shrink-0"
                      style={{ background: s.iconBg }}
                    />
                    {s.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 order-1 md:order-2">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 delay-100 fill-mode-both mb-12">
            <span className="bg-[#B8F0D4] border-2 border-[#1A1A1A] inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4">
              <Shield size={11} strokeWidth={3} /> Privacy Policy
            </span>
            <h1 className="font-display font-extrabold text-[clamp(36px,5vw,56px)] tracking-tight uppercase m-0 mb-4 leading-tight">
              Your data,
              <br />
              <span
                className="text-transparent"
                style={{ WebkitTextStroke: "2px #111" }}
              >
                your control.
              </span>
            </h1>
            <p className="text-base text-gray-500 leading-relaxed font-medium max-w-xl m-0">
              We built Tabi to help groups plan trips, not to monetize your
              data. This page explains what we collect, why, and what you can do
              about it.
            </p>
            <div className="flex gap-4 mt-5 flex-wrap">
              <span className="text-xs text-gray-500 font-medium font-mono">
                Last updated: March 2026
              </span>
              <span className="text-xs text-gray-500">·</span>
              <span className="text-xs text-gray-500 font-medium">
                Effective immediately
              </span>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200 fill-mode-both mb-10">
            <div className="border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] bg-[#FFF3B0] rounded-xl p-6 md:p-7">
              <div className="font-display font-bold text-[15px] mb-3 uppercase tracking-wide">
                TL;DR
              </div>
              <div className="flex flex-col gap-2">
                {tldr.map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-2.5 text-sm font-medium leading-relaxed"
                  >
                    <span className="shrink-0 font-bold text-[#1A1A1A]">→</span>
                    <span className="text-gray-700">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {sections.map((section) => (
              <div
                key={section.title}
                id={section.title.toLowerCase().replace(/\s+/g, "-")}
                className="scroll-mt-20 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] bg-white rounded-xl overflow-hidden transition-all hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_#1A1A1A]"
              >
                <div className="flex items-center gap-3 p-5 border-b-2 border-[#1A1A1A] bg-[#FAFAF8]">
                  <div
                    className="w-9 h-9 border-2 border-[#1A1A1A] rounded-lg flex items-center justify-center shadow-[2px_2px_0px_#1A1A1A] shrink-0"
                    style={{ background: section.iconBg }}
                  >
                    {section.icon}
                  </div>
                  <h2 className="font-display font-bold text-lg text-[#111] m-0">
                    {section.title}
                  </h2>
                </div>

                <div className="p-6 flex flex-col gap-5">
                  {section.content.map((item) => (
                    <div key={item.subtitle}>
                      <div className="font-display font-bold text-sm mb-1.5 text-[#111]">
                        {item.subtitle}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed m-0 font-medium whitespace-pre-line">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] bg-white rounded-xl p-7">
            <h2 className="font-display font-bold text-lg m-0 mb-2.5 text-[#111]">
              Questions?
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed font-medium m-0 mb-6">
              If something here doesn&apos;t make sense or you want to exercise
              any of your rights, reach out directly. We&apos;re a small team
              and we actually read our emails.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a
                href="mailto:atharvdange.dev@proton.me"
                className="bg-[#93CDFF] px-5 py-2.5 rounded-lg text-[13px] text-[#111] font-bold border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] transition-all no-underline inline-flex items-center"
              >
                atharvdange.dev@proton.me
              </a>
              <Link
                href="/terms"
                className="bg-[#FAFAF8] px-5 py-2.5 rounded-lg text-[13px] text-[#111] font-bold border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] transition-all no-underline inline-flex items-center"
              >
                Read Terms of Service
              </Link>
            </div>
          </div>
        </main>
      </div>

      <HomeFooter />
    </div>
  );
}
