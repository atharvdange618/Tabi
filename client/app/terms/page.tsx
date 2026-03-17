import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  UserCheck,
  AlertTriangle,
  Scale,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { HomeFooter } from "@/components/home/HomeFooter";

export const metadata = {
  title: "Terms of Service  ",
  description:
    "The rules of the road for using Tabi. Written like a human, not a legal department.",
};

const sections = [
  {
    icon: <UserCheck size={20} color="#111" />,
    iconBg: "#93CDFF",
    title: "Using Tabi",
    content: [
      {
        subtitle: "Who can use Tabi",
        text: "You must be at least 13 years old to use Tabi. By creating an account, you confirm you meet this requirement. If you're under 18, you should have a parent or guardian's permission.",
      },
      {
        subtitle: "Your account",
        text: "You're responsible for keeping your account secure. Authentication is handled by Clerk   use a strong password and don't share your credentials. If you suspect unauthorised access, contact us at atharvdange.dev@proton.me immediately.",
      },
      {
        subtitle: "Acceptable use",
        text: "Use Tabi for planning trips. Don't use it to harass other users, upload illegal content, attempt to breach security, scrape data, or do anything that a reasonable person would consider harmful. We reserve the right to suspend accounts that violate this.",
      },
      {
        subtitle: "Inviting others",
        text: "When you invite someone to a trip, you're responsible for that invitation. Only invite people who have agreed to use the platform. Don't add people without their knowledge.",
      },
    ],
  },
  {
    icon: <FileText size={20} color="#111" />,
    iconBg: "#B8F0D4",
    title: "Your content",
    content: [
      {
        subtitle: "You own your data",
        text: "Everything you create in Tabi   trips, itineraries, activities, files, comments   belongs to you. We don't claim any ownership over your content.",
      },
      {
        subtitle: "License to operate the service",
        text: "By using Tabi, you grant us a limited, non-exclusive license to store and display your content for the purpose of running the service. We need this to show your trip to your collaborators. That's the full extent of it.",
      },
      {
        subtitle: "Content you upload",
        text: "Don't upload files you don't have the rights to share. Don't upload anything illegal, harmful, or that violates someone else's privacy. We use Cloudinary for file storage and reserve the right to remove content that violates these terms.",
      },
      {
        subtitle: "Shared trips",
        text: "When you share a trip with collaborators, they can view and (depending on their role) edit content within that trip. You control who you invite and at what permission level.",
      },
    ],
  },
  {
    icon: <AlertTriangle size={20} color="#111" />,
    iconBg: "#FFF3B0",
    title: "What we don't guarantee",
    content: [
      {
        subtitle: "Uptime",
        text: "Tabi is provided as-is. We aim for high availability but we're not promising 99.9% SLA uptime   this is a hackathon project. There may be downtime, bugs, or data migrations that temporarily affect access.",
      },
      {
        subtitle: "Accuracy",
        text: "We don't verify any of the trip information, activity details, or expense data you or your collaborators enter. That's all user-generated. Don't rely on Tabi as the single source of truth for critical travel documents.",
      },
      {
        subtitle: "Data loss",
        text: "We do our best to keep your data safe with MongoDB Atlas backups, but we can't guarantee against data loss. For critical documents like passports or visas, keep separate backups.",
      },
      {
        subtitle: "Third-party services",
        text: "Tabi integrates with Clerk, Cloudinary, MongoDB Atlas, and Vercel. We're not responsible for outages or issues originating from these providers.",
      },
    ],
  },
  {
    icon: <Scale size={20} color="#111" />,
    iconBg: "#FFD6C0",
    title: "Liability",
    content: [
      {
        subtitle: "Limitation of liability",
        text: "To the extent permitted by law, Tabi and its creators are not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability to you for any claim won't exceed the amount you've paid us in the last 12 months (which, given we're free, is zero).",
      },
      {
        subtitle: "Indemnification",
        text: "You agree to indemnify Tabi and its team from any claims arising from your misuse of the platform, your content, or your violation of these terms.",
      },
      {
        subtitle: "Travel responsibility",
        text: "Tabi is a planning tool. We are not a travel agency, booking platform, or travel insurer. We're not responsible for any aspect of your actual trip   flight delays, hotel issues, cancelled plans, or anything else that happens when you're actually travelling.",
      },
    ],
  },
  {
    icon: <RefreshCw size={20} color="#111" />,
    iconBg: "#FFB8B8",
    title: "Changes & termination",
    content: [
      {
        subtitle: "Changes to these terms",
        text: "We may update these terms from time to time. When we do, we'll update the date at the top of this page. Continued use of Tabi after a change means you accept the updated terms.",
      },
      {
        subtitle: "Terminating your account",
        text: "You can stop using Tabi and delete your account at any time. We'll remove your personal data within 30 days. Some anonymized content may remain if it's linked to other users' trips.",
      },
      {
        subtitle: "Termination by us",
        text: "We reserve the right to suspend or terminate accounts that violate these terms, with or without notice depending on severity. Obvious violations (illegal content, harassment, security attacks) result in immediate termination.",
      },
      {
        subtitle: "Discontinuation",
        text: "If we ever shut down Tabi, we'll give reasonable notice and provide a way for you to export your data before the service goes offline.",
      },
    ],
  },
  {
    icon: <HelpCircle size={20} color="#111" />,
    iconBg: "#93CDFF",
    title: "Miscellaneous",
    content: [
      {
        subtitle: "Governing law",
        text: "These terms are governed by the laws of India. Any disputes will be handled in Indian courts. (This is a hackathon project   if you're actually lawyering up over Tabi, something has gone very wrong.)",
      },
      {
        subtitle: "Entire agreement",
        text: "These terms, together with our Privacy Policy, constitute the full agreement between you and Tabi. If any provision is found unenforceable, the rest of the terms remain in effect.",
      },
      {
        subtitle: "No waiver",
        text: "If we don't enforce a provision of these terms in a given situation, that doesn't mean we're waiving the right to enforce it later.",
      },
    ],
  },
];

export default function TermsPage() {
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
            <span className="bg-[#FFD6C0] border-2 border-[#1A1A1A] inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4">
              <Scale size={11} strokeWidth={3} /> Terms of Service
            </span>
            <h1 className="font-display font-extrabold text-[clamp(36px,5vw,56px)] tracking-tight uppercase m-0 mb-4 leading-tight">
              The rules,
              <br />
              <span
                className="text-transparent"
                style={{ WebkitTextStroke: "2px #111" }}
              >
                plain and
              </span>{" "}
              <span className="text-[#93CDFF]">simple.</span>
            </h1>
            <p className="text-base text-gray-500 leading-relaxed font-medium max-w-xl m-0">
              We wrote these in plain English because legalese serves lawyers,
              not users. Read through it won&apos;t take long.
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
                The short version
              </div>
              <div className="flex flex-col gap-2">
                {[
                  "Use Tabi for planning trips. Don't misuse it.",
                  "Your content is yours. We just host it.",
                  "We're free and come with no guarantees of uptime.",
                  "We're not responsible for your actual travel.",
                  "You can delete your account any time.",
                ].map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-2.5 text-sm font-medium leading-relaxed"
                  >
                    <span className="shrink-0 font-bold mt-px">→</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-8 border-2 border-[#1A1A1A] rounded-xl p-4 md:p-5 bg-white flex gap-3 items-start shadow-[3px_3px_0px_#1A1A1A]">
            <AlertTriangle
              size={16}
              strokeWidth={2.5}
              color="#111"
              className="shrink-0 mt-0.5"
            />
            <p className="text-[13px] text-gray-600 leading-relaxed font-medium m-0">
              By creating an account or using Tabi, you agree to these terms. If
              you don&apos;t agree, don&apos;t use the service no hard feelings.
            </p>
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
                      <p className="text-sm text-gray-600 leading-relaxed m-0 font-medium">
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
              Questions about these terms?
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed font-medium m-0 mb-6">
              If any of this is unclear or you want to discuss something, just
              email us. We&apos;ll respond like humans.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a
                href="mailto:atharvdange.dev@proton.me"
                className="bg-[#93CDFF] px-5 py-2.5 rounded-lg text-[13px] text-[#111] font-bold border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] transition-all no-underline inline-flex items-center"
              >
                atharvdange.dev@proton.me
              </a>
              <Link
                href="/privacy"
                className="bg-[#FAFAF8] px-5 py-2.5 rounded-lg text-[13px] text-[#111] font-bold border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] transition-all no-underline inline-flex items-center"
              >
                Read Privacy Policy
              </Link>
            </div>
          </div>
        </main>
      </div>

      <HomeFooter />
    </div>
  );
}
