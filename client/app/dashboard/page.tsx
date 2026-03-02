import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-brand-cream p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold font-display mb-6">Your Trips</h1>
        <div className="brutal-card rounded-lg p-8 text-center">
          <p className="text-muted-foreground font-body">
            No trips yet. Create your first trip to get started.
          </p>
          <Link
            href="/trips/new"
            className="brutal-button bg-brand-blue px-6 py-3 rounded-md text-sm inline-block mt-4"
          >
            Create Trip
          </Link>
        </div>
      </div>
    </main>
  );
}
