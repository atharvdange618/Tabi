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
import { generateOGImageUrl, createCanonicalUrl, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Tabi - Collaborative Trip Planning",
  description:
    "Plan trips together with your whole group. Build day-wise itineraries, split expenses, manage files, and collaborate in real time. No email chains, no spreadsheet chaos.",
  keywords: [
    "trip planning",
    "travel itinerary",
    "collaborative travel",
    "group trips",
    "group travel planner",
    "vacation planning",
    "trip organizer",
  ],
  alternates: {
    canonical: createCanonicalUrl("/"),
  },
  openGraph: {
    title: `${SITE_NAME} - Collaborative Trip Planning`,
    description:
      "Plan trips together with your whole group. Build day-wise itineraries, split expenses, and collaborate in real time.",
    url: createCanonicalUrl("/"),
    images: [
      {
        url: generateOGImageUrl({
          title: "Plan trips together, seamlessly",
          description:
            "Build itineraries, track budgets, collaborate in real time",
          forceGenerate: true,
        }),
        width: 1200,
        height: 630,
        alt: "Tabi - Collaborative Trip Planning",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Collaborative Trip Planning`,
    description:
      "Plan trips together with your whole group. Build itineraries, split expenses, and collaborate in real time.",
    images: [
      generateOGImageUrl({
        title: "Plan trips together, seamlessly",
        description:
          "Build itineraries, track budgets, collaborate in real time",
        forceGenerate: true,
      }),
    ],
  },
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
