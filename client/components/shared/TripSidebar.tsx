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
  Menu,
  Settings,
} from "lucide-react";
import { useTripStore } from "@/store/tripStore";
import { useTrip } from "@/hooks/useTrips";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { label: "Itinerary", href: "itinerary", icon: CalendarDays },
  { label: "Members", href: "members", icon: Users },
  { label: "Checklists", href: "checklists", icon: CheckSquare },
  { label: "Files", href: "files", icon: FileText },
  { label: "Reservations", href: "reservations", icon: Bookmark },
  { label: "Budget", href: "budget", icon: Wallet },
  { label: "Settings", href: "settings", icon: Settings },
];

function NavLinks({
  basePath,
  pathname,
  withTooltips = false,
}: {
  basePath: string;
  pathname: string;
  withTooltips?: boolean;
}) {
  return (
    <>
      {navItems.map((item) => {
        const href = `${basePath}/${item.href}`;
        const isActive = pathname === href;
        const Icon = item.icon;

        const link = (
          <Link
            key={item.href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium font-body transition-all ${
              isActive
                ? "bg-brand-blue text-foreground font-bold border-2 border-brutal-border shadow-[2px_2px_0px_#1a1a1a]"
                : "text-muted-foreground hover:bg-brand-blue/10 hover:text-foreground hover:border-2 hover:border-brutal-border/30 border-2 border-transparent"
            }`}
          >
            <Icon size={18} className="shrink-0" />
            {!withTooltips && <span>{item.label}</span>}
          </Link>
        );

        if (!withTooltips) return link;

        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </>
  );
}

export default function TripSidebar() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useTripStore();
  const { data: trip } = useTrip(params.id);

  const basePath = `/trips/${params.id}`;

  return (
    <TooltipProvider>
      {/* ── Mobile: hamburger + Sheet drawer ── */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="p-2 rounded-md bg-white border-2 border-brutal-border shadow-[3px_3px_0px_theme(--color-brutal-shadow)]"
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4 flex flex-col gap-4">
            <div>
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
            <nav className="space-y-1">
              <NavLinks basePath={basePath} pathname={pathname} />
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Desktop sidebar ── */}
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
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md border-2 border-transparent hover:border-brutal-border/30 hover:bg-brand-blue/10 hover:shadow-[2px_2px_0px_#1a1a1a] transition-all shrink-0"
                aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {sidebarOpen ? (
                  <PanelLeftClose size={18} />
                ) : (
                  <PanelLeft size={18} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {sidebarOpen ? "Collapse" : "Expand"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1">
          <nav className="space-y-1">
            {sidebarOpen ? (
              <NavLinks basePath={basePath} pathname={pathname} />
            ) : (
              <NavLinks basePath={basePath} pathname={pathname} withTooltips />
            )}
          </nav>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  );
}
