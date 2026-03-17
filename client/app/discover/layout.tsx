import type { Metadata } from "next";
import { generateOGImageUrl, createCanonicalUrl, SITE_NAME } from "@/lib/seo";
import { DiscoverNav } from "@/components/discover/DiscoverNav";
import { HomeFooter } from "@/components/home/HomeFooter";

export const metadata: Metadata = {
  title: "Discover Trips",
  description:
    "Browse and discover public trip itineraries from travelers around the world. Get inspiration for your next adventure with detailed day-by-day plans, destinations, and travel tips.",
  keywords: [
    "trip inspiration",
    "travel ideas",
    "trip planning",
    "itinerary ideas",
    "travel destinations",
    "public trips",
    "travel community",
  ],
  alternates: {
    canonical: createCanonicalUrl("/discover"),
  },
  openGraph: {
    title: `Discover Trips | ${SITE_NAME}`,
    description:
      "Browse public trip itineraries from travelers around the world. Get inspiration for your next adventure.",
    url: createCanonicalUrl("/discover"),
    images: [
      {
        url: generateOGImageUrl({
          title: "Discover Trips",
          description: "Browse travel inspiration from around the world",
          forceGenerate: true,
        }),
        width: 1200,
        height: 630,
        alt: "Tabi - Discover Trips",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Discover Trips | ${SITE_NAME}`,
    description:
      "Browse public trip itineraries from travelers around the world.",
  },
};

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DiscoverNav />
      {children}
      <HomeFooter />
    </>
  );
}
