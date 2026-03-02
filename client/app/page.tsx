import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-cream">
      <div className="brutal-card rounded-lg p-12 text-center max-w-lg">
        <h1 className="text-5xl font-extrabold font-display mb-4">
          Tabi <span className="font-kanji">旅</span>
        </h1>
        <p className="text-lg text-muted-foreground font-body mb-8">
          Plan trips together. Build itineraries, track budgets, and collaborate
          in real time.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-up"
            className="brutal-button bg-brand-blue px-6 py-3 rounded-md text-sm"
          >
            Get Started
          </Link>
          <Link
            href="/sign-in"
            className="brutal-button bg-white px-6 py-3 rounded-md text-sm"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
