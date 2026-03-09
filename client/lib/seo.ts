/**
 * SEO Utilities for Tabi
 * Centralized SEO constants and JSON-LD schema generators
 */

import { Metadata } from "next";

export const SITE_NAME = "Tabi";
export const SITE_TAGLINE = "Your journey, together.";
export const SITE_DESCRIPTION =
  "Plan trips together seamlessly. Build day-wise itineraries, split expenses, manage files, and collaborate in real-time with your travel group.";

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://tabi.atharvdangedev.in";

export const PRIMARY_KEYWORDS = [
  "trip planning",
  "travel itinerary",
  "collaborative travel",
  "group trips",
  "group travel planner",
  "shared itinerary",
  "trip organizer",
  "travel collaboration",
  "vacation planning",
  "group trip organizer",
];

export const SOCIAL_LINKS = {
  twitter: "",
  github: "https://github.com/atharvdange618",
};

export const DEFAULT_OG_IMAGE = "/og-image.png";
export const LOGO_IMAGE = "/logo-for-og-image.png";

/**
 * Organization Schema
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: "Tabi Travel",
    url: SITE_URL,
    logo: `${SITE_URL}${LOGO_IMAGE}`,
    description: SITE_DESCRIPTION,
    sameAs: Object.values(SOCIAL_LINKS).filter(Boolean),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      url: SITE_URL,
    },
  };
}

/**
 * WebSite Schema
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * BreadcrumbList Schema
 */
export function generateBreadcrumbSchema(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * SoftwareApplication Schema
 */
export function generateSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "TravelApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      ratingCount: "1",
    },
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    screenshot: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
  };
}

/**
 * Trip/TouristTrip Schema
 */
export function generateTripSchema(tripData: {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  url: string;
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Trip",
    name: tripData.name,
    url: tripData.url,
  };

  if (tripData.description) {
    schema.description = tripData.description;
  }

  if (tripData.startDate && tripData.endDate) {
    schema.startDate = tripData.startDate;
    schema.endDate = tripData.endDate;
  }

  return schema;
}

/**
 * FAQ Schema
 */
export function generateFAQSchema(
  faqs: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate OpenGraph image URL using the dynamic OG route
 */
export function generateOGImageUrl(params: {
  title: string;
  description?: string;
  coverImage?: string;
  forceGenerate?: boolean;
}): string {
  if (!params.coverImage && !params.forceGenerate) {
    return DEFAULT_OG_IMAGE;
  }

  const searchParams = new URLSearchParams();
  searchParams.set("title", params.title);
  if (params.description) {
    searchParams.set("description", params.description);
  }
  if (params.coverImage) {
    searchParams.set("coverImage", params.coverImage);
  }
  return `${SITE_URL}/api/og?${searchParams.toString()}`;
}

/**
 * Create canonical URL
 */
export function createCanonicalUrl(path: string): string {
  const cleanPath = path === "/" ? "" : path.replace(/\/$/, "");
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Base metadata configuration
 */
export function getBaseMetadata(): Partial<Metadata> {
  return {
    metadataBase: new URL(SITE_URL),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

/**
 * Merge metadata with base configuration
 */
export function mergeMetadata(
  custom: Metadata,
  base: Partial<Metadata> = getBaseMetadata(),
): Metadata {
  return {
    ...base,
    ...custom,
  } as Metadata;
}
