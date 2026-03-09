import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Users,
  Banknote,
  FolderOpen,
  ClipboardList,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HomeFooter } from "@/components/home/HomeFooter";
import { generateOGImageUrl, createCanonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "The Story of Tabi · 旅",
  description:
    "How a chaotic WhatsApp group, one too many shared Google Sheets, and a hackathon deadline created Tabi - the collaborative trip planning tool that actually works.",
  alternates: {
    canonical: createCanonicalUrl("/story"),
  },
  openGraph: {
    title: "The Story of Tabi · 旅",
    description:
      "How a chaotic WhatsApp group and shared Google Sheets chaos led to building Tabi.",
    url: createCanonicalUrl("/story"),
    images: [
      {
        url: generateOGImageUrl({
          title: "The Story of Tabi · 旅",
          description: "From WhatsApp chaos to collaborative trip planning",
          forceGenerate: true,
        }),
        width: 1200,
        height: 630,
        alt: "The Story of Tabi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Story of Tabi · 旅",
    description:
      "How a chaotic WhatsApp group and shared Google Sheets chaos led to building Tabi.",
    images: [
      generateOGImageUrl({
        title: "The Story of Tabi · 旅",
        description: "From WhatsApp chaos to collaborative trip planning",
        forceGenerate: true,
      }),
    ],
  },
};

const timeline = [
  {
    year: "Year Zero",
    title: "The Crime",
    color: "bg-brand-coral",
    content: `Someone's planning a group trip. They create a WhatsApp group called "GOOAAAA 🏖️🏖️🏖️". That's where the story begins. And ends. And begins again. And never actually resolves.`,
    aside: "The group still exists. Nobody's left it. Nobody ever does.",
  },
  {
    year: "Day 3",
    title: "The Spreadsheet Era",
    color: "bg-brand-lemon",
    content: `One person   always one specific person, you know who they are   makes a Google Sheet. It has tabs. Multiple tabs. A budget tab, an activities tab, a "misc" tab that becomes 60% of the planning. It's a masterpiece. Nobody updates it except them.`,
    aside: "The Sheet is still open in 11 browser tabs across 4 devices.",
  },
  {
    year: "Day 7",
    title: "The Chaos Peaks",
    color: "bg-brand-peach",
    content: `Flight links are sent in the WhatsApp group. Then buried under 200 messages of "who's booking?" "I thought you were booking?" "wait what time does the train leave" and a completely unrelated meme someone sent at 2am.`,
    aside: "The meme was funny though.",
  },
  {
    year: "Day 11",
    title: "The Reckoning",
    color: "bg-brand-mint",
    content: `Trip's over. Someone paid for dinner four times. Someone paid for nothing. The awkward "hey so about the money" message gets drafted, deleted, redrafted, and sent as a voice note instead. It remains unlistened to for six business days.`,
    aside: "The voice note was 4 minutes long. For a ₹340 dinner.",
  },
];

const features: {
  Icon: LucideIcon;
  animClass: string;
  title: string;
  description: string;
  tag: string;
  color: string;
}[] = [
  {
    Icon: Calendar,
    animClass: "icon-bounce",
    title: "The Itinerary That Actually Exists",
    description:
      "Day-by-day planning. Drag to reorder. Everyone can see it. Revolutionary, I know.",
    tag: "RIP the Google Sheet",
    color: "bg-brand-blue",
  },
  {
    Icon: Users,
    animClass: "icon-pulse",
    title: "One Source of Truth",
    description:
      "Everyone has access to the same plan. No more 'let me send you the updated version'. One central place that everyone can see. Like a Google Doc but for trips and with better vibes.",
    tag: "No more 'Can you resend the link?'",
    color: "bg-brand-mint",
  },
  {
    Icon: Banknote,
    animClass: "icon-shake",
    title: "The Awkward Money Conversation, Automated",
    description:
      "Log expenses. Split them. See exactly who owes what. No voice notes. No 'oh I thought you were tracking it'. Just numbers, clean and honest.",
    tag: "Saves friendships",
    color: "bg-brand-peach",
  },
  {
    Icon: FolderOpen,
    animClass: "icon-float",
    title: "Files That Don't Live in 7 Different Chats",
    description:
      "Flight tickets. Hotel confirmations. That one screenshot with the booking reference you forwarded to yourself at 5am. All in one place, attached to the trip.",
    tag: "Cloudinary doing heavy lifting",
    color: "bg-brand-lemon",
  },
  {
    Icon: ClipboardList,
    animClass: "icon-wiggle",
    title: "Checklists for the Overthinkers",
    description:
      "Packing lists. Pre-trip TODOs. That one task nobody wants to do (exchange currency) sitting there, unchecked, judging everyone.",
    tag: "No one exchanges currency on time. Ever.",
    color: "bg-brand-coral",
  },
  {
    Icon: Ticket,
    animClass: "icon-spin",
    title: "Reservations Hub",
    description:
      "All your confirmation numbers in one place. Reference IDs. Booking links. The stuff you're going to need at the airport at 4am when your brain has fully given up.",
    tag: "JetBrains Mono for the ref IDs because it feels right",
    color: "bg-brand-blue",
  },
];

const facts = [
  { label: "WhatsApp groups made obsolete", value: "1 per trip" },
  { label: "Google Sheets retired with dignity", value: "countless" },
  { label: "Awkward money voice notes sent", value: "hopefully 0" },
  { label: "The name means", value: "journey (Japanese: 旅)" },
  { label: "Built during", value: "a hackathon, with   water" },
  { label: "Designed like", value: "it wasn't a hackathon" },
];

export default function StoryPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: createCanonicalUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Story",
        item: createCanonicalUrl("/story"),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-1deg); }
          50%       { transform: rotate(1.5deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50%       { transform: translateY(-6px) rotate(-2deg); }
        }

        .anim-1 { animation: fadeUp 0.5s ease-out 0.05s both; }
        .anim-2 { animation: fadeUp 0.5s ease-out 0.15s both; }
        .anim-3 { animation: fadeUp 0.5s ease-out 0.25s both; }

        .wiggle-card { animation: wiggle 4s ease-in-out infinite; }
        .float-badge { animation: float 3.5s ease-in-out infinite; }

        @keyframes bounce-icon {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes pulse-icon {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.18); }
        }
        @keyframes shake-icon {
          0%, 100% { transform: rotate(0deg); }
          20%       { transform: rotate(-10deg); }
          60%       { transform: rotate(10deg); }
          80%       { transform: rotate(-5deg); }
        }
        @keyframes spin-icon {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .icon-bounce { animation: bounce-icon 2s ease-in-out infinite; }
        .icon-pulse  { animation: pulse-icon 2.5s ease-in-out infinite; }
        .icon-shake  { animation: shake-icon 2s ease-in-out infinite; }
        .icon-float  { animation: float 3.5s ease-in-out infinite; }
        .icon-wiggle { animation: wiggle 4s ease-in-out infinite; }
        .icon-spin   { animation: spin-icon 5s linear infinite; }

        .brutal { border: 2px solid #1A1A1A; box-shadow: 4px 4px 0px #1A1A1A; }
        .brutal-sm { border: 2px solid #1A1A1A; box-shadow: 3px 3px 0px #1A1A1A; }
        .brutal-lift { transition: transform 150ms ease, box-shadow 150ms ease; }
        .brutal-lift:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0px #1A1A1A; }

        .zigzag-border {
          background-image: repeating-linear-gradient(
            90deg,
            #1A1A1A 0px, #1A1A1A 10px,
            transparent 10px, transparent 20px
          );
          height: 3px;
        }

        .text-stroke { -webkit-text-stroke: 2px #1A1A1A; color: transparent; }
      `}</style>

      <div className="min-h-screen bg-brand-cream font-body text-[#111]">
        <nav className="sticky top-0 z-50 h-16 bg-white border-b-2 border-[#1A1A1A] flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-brand-blue brutal-sm rounded-lg flex items-center justify-center font-kanji text-base text-[#111] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[5px_5px_0px_#1A1A1A] transition-all duration-150">
              旅
            </div>
            <span className="font-display font-black text-lg tracking-tight">
              tabi
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold border-2 border-[#1A1A1A] px-4 py-2 rounded-lg hover:bg-brand-cream hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] transition-all duration-150"
          >
            <ArrowLeft size={14} /> Back home
          </Link>
        </nav>

        <section className="max-w-4xl mx-auto px-6 pt-16 pb-12">
          <div className="anim-1 mb-6">
            <span className="float-badge inline-block bg-brand-coral brutal-sm rounded-full px-4 py-1.5 text-sm font-bold -rotate-2">
              🏖️ A love story. Sort of.
            </span>
          </div>

          <div className="anim-2 mb-6">
            <h1 className="font-display font-black text-[clamp(52px,9vw,108px)] uppercase leading-[0.9] tracking-[-0.04em]">
              The <span className="text-stroke">story</span>
              <br />
              of <span className="text-brand-blue font-kanji">旅.</span>
            </h1>
          </div>

          <p className="anim-3 text-lg font-medium text-[#6B7280] max-w-2xl leading-relaxed">
            Tabi was born from a very specific kind of suffering. The kind that
            happens in a WhatsApp group with 9 people, a shared Google Sheet
            that only one person updates, and a budget spreadsheet that was
            accurate for exactly 48 hours before becoming a work of fiction.
          </p>

          <div className="zigzag-border mt-12 mb-0 w-full" />
        </section>

        <section className="bg-[#111] py-14 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-brand-blue text-xs font-bold uppercase tracking-[0.2em] mb-4">
              The root cause
            </p>
            <p className="font-display font-black text-[clamp(28px,5vw,52px)] text-white leading-tight max-w-3xl">
              Group trip planning is organized chaos pretending to be a plan.
              <span className="text-brand-lemon"> Nobody is in charge.</span>
              <span className="text-brand-peach">
                {" "}
                Everyone assumes someone else is in charge.
              </span>
              <span className="text-brand-mint">
                {" "}
                That someone is crying in a Google Sheet.
              </span>
            </p>
          </div>
        </section>

        <div className="zigzag-border" />

        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="font-display font-black text-3xl uppercase tracking-tight mb-2">
            How It Goes.
            <br />
            Every. Single. Time.
          </h2>
          <p className="text-[#6B7280] font-medium text-sm mb-10">
            A familiar tragedy in four acts.
          </p>

          <div className="space-y-5">
            {timeline.map((beat, i) => (
              <div
                key={beat.title}
                className={cn(
                  "brutal brutal-lift bg-white rounded-2xl overflow-hidden",
                  i % 2 === 0 ? "ml-0 mr-8" : "ml-8 mr-0",
                )}
              >
                <div className={cn("h-2", beat.color)} />

                <div className="p-6 flex gap-5 flex-wrap">
                  <div className="shrink-0">
                    <span className="font-display font-black text-[11px] uppercase tracking-widest text-[#9CA3AF]">
                      {beat.year}
                    </span>
                    <p className="font-display font-black text-2xl tracking-tight text-[#111] leading-snug mt-0.5">
                      {beat.title}
                    </p>
                  </div>
                  <div className="flex-1 min-w-[200px] space-y-3">
                    <p className="text-[#374151] font-medium text-base leading-relaxed">
                      {beat.content}
                    </p>
                    <div className="flex items-start gap-2 bg-brand-cream border border-[#e5e7eb] rounded-lg px-3 py-2">
                      <span className="text-sm shrink-0">📌</span>
                      <p className="text-[#6B7280] text-xs font-semibold italic">
                        {beat.aside}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="zigzag-border" />

        <section className="bg-brand-blue border-y-2 border-[#1A1A1A] py-14 px-6">
          <div className="max-w-4xl mx-auto flex gap-8 items-center flex-wrap">
            <div className="wiggle-card brutal bg-white rounded-2xl w-32 h-32 flex items-center justify-center shrink-0 shadow-[6px_6px_0px_#1A1A1A]">
              <span className="font-kanji text-7xl text-[#111]">旅</span>
            </div>

            <div className="flex-1">
              <p className="font-display font-black text-[11px] uppercase tracking-[0.2em] text-[#111]/50 mb-2">
                The turning point
              </p>
              <h2 className="font-display font-black text-4xl uppercase tracking-tight text-[#111] leading-tight mb-3">
                Then yours truly built the thing.
              </h2>
              <p className="text-[#111]/70 font-medium text-base leading-relaxed max-w-xl">
                A hackathon. A deadline. A lot of water. And a decision to
                design it like it wasn&apos;t a hackathon because if you&apos;re
                going to build something, you might as well make it something
                you&apos;d actually use.
              </p>
            </div>
          </div>
        </section>

        <div className="zigzag-border" />

        <section className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="font-display font-black text-3xl uppercase tracking-tight mb-2">
            What Tabi Actually Does
          </h2>
          <p className="text-[#6B7280] font-medium text-sm mb-10">
            Described honestly, without the startup landing page energy.
          </p>

          <div className="grid sm:grid-cols-2 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="brutal brutal-lift bg-white rounded-xl p-5"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={cn(
                      "w-12 h-12 brutal-sm rounded-xl flex items-center justify-center shrink-0",
                      f.color,
                    )}
                  >
                    <f.Icon size={22} strokeWidth={2} className={f.animClass} />
                  </div>
                  <h3 className="font-display font-bold text-[17px] leading-snug text-[#111] mt-1">
                    {f.title}
                  </h3>
                </div>
                <p className="text-[#6B7280] text-sm font-medium leading-relaxed mb-4">
                  {f.description}
                </p>
                <span className="inline-block text-[11px] font-bold bg-brand-cream border-2 border-[#1A1A1A] rounded-full px-3 py-1 text-[#111]">
                  {f.tag}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="zigzag-border" />

        <section className="bg-[#111] py-14 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-brand-blue text-xs font-bold uppercase tracking-[0.2em] mb-8">
              By the numbers (loosely)
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {facts.map((f) => (
                <div
                  key={f.label}
                  className="border-2 border-white/15 rounded-xl p-4 hover:border-brand-blue/60 transition-colors"
                >
                  <p className="text-white/30 text-[11px] font-bold uppercase tracking-wider mb-1">
                    {f.label}
                  </p>
                  <p className="font-kanji font-bold text-xl text-white">
                    {f.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="zigzag-border" />

        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="flex gap-10 items-start flex-wrap">
            <div className="flex-1 min-w-[280px]">
              <h2 className="font-kanji font-black text-3xl uppercase tracking-tight mb-4">
                Why 旅?
              </h2>
              <p className="text-[#374151] font-kanji font-medium text-base leading-relaxed mb-4">
                旅 (tabi) means journey in Japanese. Not travel as in{" "}
                <em>booking.com</em>. Journey as in the experience, the whole
                arc of it. The before, the messy middle, the stories you tell
                afterward.
              </p>
              <p className="text-[#6B7280] font-kanji font-medium text-sm leading-relaxed mb-4">
                The name is Japanese. The product isn&apos;t Japan-specific.
                It&apos;s just a word that carries more weight than its four
                letters suggest. &quot;Journey&quot; in English sounds like a
                LinkedIn post. &quot;旅&quot; sounds like something worth
                protecting.
              </p>
              <p className="text-[#9CA3AF] font-medium text-sm leading-relaxed">
                Also it looks great in a neobrutalist card with a thick border
                and an offset shadow. That was a factor.
              </p>
            </div>

            <div className="brutal bg-brand-blue rounded-2xl p-8 shadow-[8px_8px_0px_#1A1A1A] shrink-0">
              <div className="font-kanji text-8xl text-[#111] mb-3 leading-none">
                旅
              </div>
              <p className="font-display font-bold text-base text-[#111]">
                tabi
              </p>
              <p className="text-sm font-medium text-[#111]/60 mt-0.5">
                journey · trip · travel
              </p>
              <div className="mt-4 pt-4 border-t-2 border-[#1A1A1A]">
                <p className="text-[11px] font-bold text-[#111]/40 uppercase tracking-widest">
                  Japanese
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="zigzag-border" />

        <section className="max-w-4xl mx-auto px-6 py-16">
          <p className="text-brand-blue text-xs font-bold uppercase tracking-[0.2em] mb-2">
            The real MVPs
          </p>
          <h2 className="font-display font-black text-3xl uppercase tracking-tight mb-2">
            The Testing Crew
          </h2>
          <p className="text-[#6B7280] font-medium text-sm mb-10 max-w-xl">
            Building something alone means you lose perspective fast. Every bug
            that didn&apos;t reach you was caught by these five. Voluntarily.
            That&apos;s friendship.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: "Dipali Sharma",
                handle: "Dipali2Sharma",
                color: "bg-brand-coral",
              },
              {
                name: "Nausheen Faiyaz",
                handle: "codeXninjaDev",
                color: "bg-brand-mint",
              },
              {
                name: "Mohit Kumar",
                handle: "Mohitvermacode7",
                color: "bg-brand-lemon",
              },
              {
                name: "Pritam Mandal",
                handle: "rick_jsx",
                color: "bg-brand-peach",
              },
              {
                name: "Shyamendra Hazra",
                handle: "ShyamHz",
                color: "bg-brand-blue",
              },
            ].map((person) => (
              <a
                key={person.handle}
                href={`https://x.com/${person.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="brutal brutal-lift bg-white rounded-xl p-4 flex items-center gap-3 group no-underline"
              >
                <div
                  className={`w-10 h-10 brutal-sm rounded-full flex items-center justify-center font-display font-black text-sm text-[#111] shrink-0 ${person.color}`}
                >
                  {person.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="min-w-0">
                  <p className="font-display font-bold text-sm text-[#111] leading-snug truncate">
                    {person.name}
                  </p>
                  <p className="text-[11px] font-semibold text-[#9CA3AF] group-hover:text-brand-blue transition-colors truncate">
                    @{person.handle}
                  </p>
                </div>
              </a>
            ))}

            <div className="brutal bg-[#111] rounded-xl p-4 flex items-center gap-3 sm:col-span-2 lg:col-span-1 lg:col-start-3">
              <div className="w-10 h-10 rounded-full bg-brand-blue border-2 border-white/20 flex items-center justify-center text-lg shrink-0">
                ❤️
              </div>
              <p className="text-white/80 text-xs font-medium leading-relaxed">
                Broke things early so no one else had to.{" "}
                <span className="text-white font-bold">Thank you.</span>
              </p>
            </div>
          </div>
        </section>

        <div className="zigzag-border" />

        <section className="border-t-0 bg-brand-cream px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <p className="font-display font-black text-[clamp(36px,7vw,80px)] uppercase tracking-[-0.03em] leading-tight mb-6">
              Your journey,
              <br />
              <span className="text-brand-blue">together.</span>
            </p>
            <p className="text-[#6B7280] font-medium text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Not the chaos. Not the spreadsheet. Not the 4-minute voice note
              about a ₹340 dinner. The actual trip planned, organized, and
              survived together.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/sign-up"
                className="flex items-center gap-2 bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-bold text-base px-7 py-3.5 rounded-xl hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#1A1A1A] transition-all duration-150"
              >
                Start planning <ArrowRight size={18} />
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 bg-white text-[#111] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-bold text-base px-7 py-3.5 rounded-xl hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] transition-all duration-150"
              >
                Back to home
              </Link>
            </div>
          </div>
        </section>

        <HomeFooter />
      </div>
    </>
  );
}
