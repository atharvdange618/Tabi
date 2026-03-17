"use client";

import Link from "next/link";
import { Globe, LogOut, LayoutDashboard } from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import { getInitials } from "@/lib/helpers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function PublicTripNav() {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const userName = user?.fullName ?? user?.firstName ?? "there";
  const userEmail = user?.emailAddresses[0]?.emailAddress ?? "";
  const userInitials = getInitials(userName);

  return (
    <nav className="sticky top-0 z-50 h-14 bg-white border-b-2 border-[#1A1A1A] flex items-center justify-between px-6">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-7 h-7 bg-brand-blue border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] rounded-md flex items-center justify-center font-kanji text-sm group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[4px_4px_0px_#1A1A1A] transition-all duration-150">
          旅
        </div>
        <span className="font-display font-black text-base tracking-tight">
          tabi
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-brand-cream border border-[#e5e7eb] rounded-full px-3 py-1.5">
          <Globe size={11} className="text-[#6B7280]" />
          <span className="text-[11px] font-semibold text-[#6B7280]">
            Public itinerary
          </span>
        </div>

        {isSignedIn ? (
          <>
            <NotificationCenter />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-lg border border-transparent hover:border-[#1A1A1A] hover:bg-brand-cream transition-all">
                  <div className="w-7 h-7 rounded-full bg-brand-blue border-2 border-[#1A1A1A] flex items-center justify-center text-[11px] font-bold">
                    {userInitials}
                  </div>
                  <span className="font-semibold text-sm hidden sm:block">
                    {userName}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl p-1"
              >
                <div className="px-3 py-2">
                  <p className="text-sm font-bold">{userName}</p>
                  <p className="text-xs text-[#6B7280] font-medium">
                    {userEmail}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  asChild
                  className="font-medium text-sm cursor-pointer gap-2 rounded-lg"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard size={13} /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="font-medium text-sm text-red-600 cursor-pointer gap-2 rounded-lg"
                  onClick={() => signOut({ redirectUrl: "/" })}
                >
                  <LogOut size={13} /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Link href="/sign-up">
            <Button className="bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] hover:bg-brand-blue transition-all duration-150 h-8 px-4 rounded-lg text-xs">
              Plan your own trip
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}
