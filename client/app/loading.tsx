import { PlaneTakeoff } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      <div className="brutal-card rounded-2xl p-12 text-center bg-white max-w-sm w-full shadow-[8px_8px_0px_theme(--color-brutal-shadow)]">
        <div className="w-16 h-16 bg-brand-peach rounded-2xl border-2 border-brutal-border flex items-center justify-center mb-6 mx-auto animate-bounce">
          <PlaneTakeoff size={32} />
        </div>
        <h2 className="text-xl font-bold font-display mb-2 animate-pulse">
          Loading...
        </h2>
        <p className="text-muted-foreground font-body">
          Preparing your journey.
        </p>
      </div>
    </div>
  );
}
