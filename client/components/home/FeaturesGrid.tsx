import {
  Users,
  BadgeIndianRupee,
  FileText,
  Calendar,
  CheckCircle2,
  Star,
} from "lucide-react";

const features = [
  {
    icon: <Users size={22} className="text-[#111]" aria-hidden="true" />,
    iconBg: "bg-[#93CDFF]",
    title: "Shared Workspace",
    desc: "Everyone on the trip sees the same itinerary, budget, and files. Invite members, assign roles, and plan together no separate tools needed.",
    tag: "Owner · Editor · Viewer",
    tagColor: "bg-[#93CDFF]",
  },
  {
    icon: (
      <BadgeIndianRupee size={22} className="text-[#111]" aria-hidden="true" />
    ),
    iconBg: "bg-[#FFD6C0]",
    title: "Smart Budgets",
    desc: "Log every expense, tag who paid, and see a clean breakdown by category. Tabi does the math so nobody has to do the awkward ask.",
    tag: "Split by member",
    tagColor: "bg-[#FFD6C0]",
  },
  {
    icon: <FileText size={22} className="text-[#111]" aria-hidden="true" />,
    iconBg: "bg-[#B8F0D4]",
    title: "Organized Docs",
    desc: "Flight tickets, hotel confirmations, booking screenshots upload them once and they live inside the trip. Everyone has access, always.",
    tag: "Images · Tickets",
    tagColor: "bg-[#B8F0D4]",
  },
  {
    icon: <Calendar size={22} className="text-[#111]" aria-hidden="true" />,
    iconBg: "bg-[#FFF3B0]",
    title: "Day-by-Day Plans",
    desc: "Break your trip into days, fill each with activities, set times, and drag to reorder. The full itinerary in a visual timeline.",
    tag: "Drag to reorder",
    tagColor: "bg-[#FFF3B0]",
  },
  {
    icon: <CheckCircle2 size={22} className="text-[#111]" aria-hidden="true" />,
    iconBg: "bg-[#FFB8B8]",
    title: "Checklists",
    desc: "Packing lists, to-dos, and group tasks. Keep track of what needs to be done and check items off as you go. No separate notes app needed.",
    tag: "Shared to-dos",
    tagColor: "bg-[#FFB8B8]",
  },
  {
    icon: <Star size={22} className="text-[#111]" aria-hidden="true" />,
    iconBg: "bg-[#93CDFF]",
    title: "Reservations Hub",
    desc: "Store confirmation numbers, reference IDs, booking links, and notes for every reservation. Your entire trip in one dashboard.",
    tag: "Confirmations & links",
    tagColor: "bg-[#FFF3B0]",
  },
];

export function FeaturesGrid() {
  return (
    <section className="max-w-[1100px] mx-auto py-[100px] px-6">
      <div className="text-center mb-16">
        <span className="badge tag-rotate-2 inline-flex bg-[#B8F0D4] mb-4">
          Everything in one place
        </span>
        <h2 className="font-display font-extrabold text-[clamp(32px,4vw,52px)] tracking-tight text-[#111111] uppercase m-0 text-balance">
          Your group trip, handled.
        </h2>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] gap-6">
        {features.map((f) => (
          <div key={f.title} className="feature-card">
            <div
              className={`w-11 h-11 ${f.iconBg} border-2 border-[#1A1A1A] rounded-[10px] flex items-center justify-center mb-5 shadow-[2px_2px_0px_#1A1A1A]`}
            >
              {f.icon}
            </div>
            <h3 className="font-display font-bold text-xl mb-2.5 text-[#111]">
              {f.title}
            </h3>
            <p className="text-gray-500 text-[15px] leading-relaxed mb-4 font-medium">
              {f.desc}
            </p>
            <span className={`badge text-[11px] ${f.tagColor}`}>{f.tag}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
