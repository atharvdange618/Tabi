import Link from "next/link";

export function HomeNav() {
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
    </nav>
  );
}
