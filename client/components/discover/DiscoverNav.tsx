"use client";

import Link from "next/link";
import { LogOut, LayoutDashboard, Compass } from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import { getInitials } from "@/lib/helpers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DiscoverNav() {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();

  const userName = user?.fullName ?? user?.firstName ?? "there";
  const userEmail = user?.emailAddresses[0]?.emailAddress ?? "";
  const userInitials = getInitials(userName);

  return (
    <nav className="bg-white border-b-2 border-brutal-border px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="logo-link no-underline">
        <div className="flex items-center gap-2.5">
          <div className="anim-logo logo-mark">旅</div>
          <span className="font-display font-extrabold text-xl text-foreground tracking-[-0.02em]">
            tabi
          </span>
        </div>
      </Link>

      {isSignedIn ? (
        <div className="flex items-center gap-1.5">
          <Link
            href="/discover"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-transparent text-sm font-semibold text-[#111] bg-zinc-100 hover:bg-brand-blue hover:border-[#1A1A1A] hover:shadow-[3px_3px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all duration-150"
          >
            <Compass size={15} className="transition-transform duration-150 group-hover:rotate-12" />
            Discover
          </Link>
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
              <DropdownMenuItem
                className="font-medium text-sm text-red-600 cursor-pointer gap-2 rounded-lg"
                onClick={() => signOut({ redirectUrl: "/" })}
              >
                <LogOut size={13} /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="hover:bg-[#f5f5f5] px-4 py-2 font-bold text-foreground no-underline text-sm font-display rounded-md transition-colors duration-150"
          >
            Log in
          </Link>
          <Link
            href="/sign-up"
            className="brutal-btn bg-brand-blue px-3 sm:px-5 py-2 rounded-lg text-sm no-underline text-foreground"
          >
            <span className="hidden sm:inline">Start Planning</span>
            <span className="sm:hidden">Sign up</span>
          </Link>
        </div>
      )}
    </nav>
  );
}
