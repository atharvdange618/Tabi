import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trip",
};

export default function TripLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-brand-cream">
      {/* Sidebar will be built here */}
      <aside className="w-64 border-r-2 border-brutal-border bg-white p-4 hidden md:block">
        <nav className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Trip Navigation
          </p>
          {[
            { label: "Itinerary", href: "itinerary" },
            { label: "Members", href: "members" },
            { label: "Checklists", href: "checklists" },
            { label: "Files", href: "files" },
            { label: "Reservations", href: "reservations" },
            { label: "Budget", href: "budget" },
          ].map((item) => (
            <div
              key={item.href}
              className="block px-3 py-2 rounded-md text-sm font-medium font-body hover:bg-brand-blue/20 transition-colors"
            >
              {item.label}
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
