import Link from "next/link";

export function HomeFooter() {
  return (
    <footer className="border-t-2 border-[#1A1A1A] bg-white">
      <div className="max-w-[1100px] mx-auto py-6 px-6 flex items-center justify-between gap-4 flex-wrap">
        <Link href="/" className="logo-link no-underline">
          <div className="flex items-center gap-2.5">
            <div className="border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] bg-[#93CDFF] rounded-md w-7 h-7 flex items-center justify-center text-sm font-kanji">
              旅
            </div>
            <span className="font-display font-extrabold text-[17px] text-[#111111] tracking-tight">
              tabi
            </span>
          </div>
        </Link>

        <div className="flex gap-6">
          {["Privacy", "Terms"].map((link) => (
            <Link
              key={link}
              href={`/${link.toLowerCase()}`}
              className="font-bold text-[13px] text-[#111111] no-underline"
            >
              {link}
            </Link>
          ))}

          <Link
            href="/story"
            className="font-bold text-[13px] text-[#111111] no-underline"
          >
            The Story ❤️
          </Link>
        </div>

        <p className="text-gray-500 text-[13px] font-medium m-0 w-full text-center">
          &copy; {new Date().getFullYear()} Tabi. Built for the journey.
        </p>
      </div>
    </footer>
  );
}
