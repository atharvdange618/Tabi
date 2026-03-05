"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  CalendarDays,
  Users,
  CheckSquare,
  FileText,
  Bookmark,
  Wallet,
  PanelLeftClose,
  PanelLeft,
  ArrowLeft,
} from "lucide-react";
import { useTripStore } from "@/store/tripStore";
import { useTrip } from "@/hooks/useTrips";

const navItems = [
  { label: "Itinerary", href: "itinerary", icon: CalendarDays },
  { label: "Members", href: "members", icon: Users },
  { label: "Checklists", href: "checklists", icon: CheckSquare },
  { label: "Files", href: "files", icon: FileText },
  { label: "Reservations", href: "reservations", icon: Bookmark },
  { label: "Budget", href: "budget", icon: Wallet },
];

export default function TripSidebar() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useTripStore();
  const { data: trip } = useTrip(params.id);

  const basePath = `/trips/${params.id}`;

  return (
    <aside
      className={`border-r-2 border-brutal-border bg-white transition-all duration-200 flex flex-col ${sidebarOpen ? "w-64 p-4" : "w-14 p-2"} hidden md:flex`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {sidebarOpen && (
          <div className="min-w-0 flex-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
            >
              <ArrowLeft size={12} />
              Trips
            </Link>
            <h2 className="text-sm font-bold font-display truncate">
              {trip?.title || "Loading..."}
            </h2>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded hover:bg-brand-blue/20 transition-colors flex-shrink-0"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const href = `${basePath}/${item.href}`;
          const isActive = pathname === href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium font-body transition-colors ${
                isActive
                  ? "bg-brand-blue/30 text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-brand-blue/10 hover:text-foreground"
              }`}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
