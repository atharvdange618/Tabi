import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { HomeNav } from "../components/home/HomeNav";
import { HeroSection } from "../components/home/HeroSection";
import { StatsBar } from "../components/home/StatsBar";
import { FeaturesGrid } from "../components/home/FeaturesGrid";
import { HowItWorks } from "../components/home/HowItWorks";
import { CTASection } from "../components/home/CTASection";
import { HomeFooter } from "../components/home/HomeFooter";

export const metadata: Metadata = {
  title: "Tabi - Collaborative Trip Planning",
  description:
    "Plan trips together with your whole group. Build itineraries, split expenses, and collaborate in real time   no email chains required.",
};

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen font-body text-foreground bg-background">
      <HomeNav />
      <HeroSection />
      <StatsBar />
      <FeaturesGrid />
      <HowItWorks />
      <CTASection />
      <HomeFooter />
    </div>
  );
}
