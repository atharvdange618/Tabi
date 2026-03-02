import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Trip",
};

export default function NewTripPage() {
  return (
    <main className="min-h-screen bg-brand-cream p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold font-display mb-6">
          Create a New Trip
        </h1>
        <div className="brutal-card rounded-lg p-8">
          <p className="text-muted-foreground font-body">
            Trip creation form will be built here with React Hook Form + Zod
            validation and react-day-picker for date range selection.
          </p>
        </div>
      </div>
    </main>
  );
}
