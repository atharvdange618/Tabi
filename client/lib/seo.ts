/**
 * SEO Utilities for Tabi
 * Centralized SEO constants and JSON-LD schema generators
 */

export const SITE_NAME = "Tabi";
export const SITE_TAGLINE = "Your journey, together.";
export const SITE_DESCRIPTION =
  "Plan trips with your whole group. Build day-wise itineraries, split expenses, manage files, and collaborate in real-time with your travel group.";

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://tabi.atharvdange.com";

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
  twitter: "https://x.com/atharvdangedev",
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
 * Serialize JSON-LD for a <script> tag. JSON.stringify leaves "<" as is, so
 * user text like "</script>" would close the tag early and inject markup.
 */
export function toJsonLd(schema: object): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}

/**
 * Create canonical URL
 */
export function createCanonicalUrl(path: string): string {
  const cleanPath = path === "/" ? "" : path.replace(/\/$/, "");
  return `${SITE_URL}${cleanPath}`;
}
