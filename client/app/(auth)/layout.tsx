import Link from "next/link";

const highlights = [
  { label: "Day-by-day plans the whole group can edit", color: "bg-brand-mint" },
  { label: "Shared budgets that split costs for you", color: "bg-brand-peach" },
  { label: "Tickets and bookings stored inside the trip", color: "bg-brand-lemon" },
];

function Logo() {
  return (
    <Link href="/" className="logo-link no-underline">
      <div className="flex items-center gap-2.5">
        <div className="logo-mark">旅</div>
        <span className="font-display font-extrabold text-xl text-foreground tracking-[-0.02em]">
          tabi
        </span>
      </div>
    </Link>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden border-r-2 border-brutal-border bg-brand-blue p-12 lg:flex lg:flex-col lg:justify-between">
        <Logo />

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-5xl font-extrabold uppercase leading-[1.05] tracking-tight text-[#111111]">
            Plan trips together.
          </h1>
          <p className="mt-4 text-lg font-medium text-[#111111]/80">
            One shared itinerary for your whole group.
          </p>
          <ul className="mt-8 space-y-3">
            {highlights.map((h) => (
              <li
                key={h.label}
                className={`rounded-lg border-2 border-brutal-border ${h.color} px-4 py-3 font-semibold text-[#111111] shadow-[3px_3px_0px_#1a1a1a]`}
              >
                {h.label}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm font-medium text-[#111111]/70">
          旅 (tabi) means journey in Japanese.
        </p>

        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -bottom-16 select-none font-kanji text-[320px] leading-none text-[#111111]/10"
        >
          旅
        </span>
      </aside>

      <main className="flex flex-col items-center justify-center gap-8 bg-brand-cream px-4 py-12">
        <div className="lg:hidden">
          <Logo />
        </div>
        {children}
      </main>
    </div>
  );
}
