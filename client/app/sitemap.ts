import type { MetadataRoute } from "next";
import type { ApiResponse } from "shared/types";
import type { DiscoverTripsResponse } from "@/hooks/useTrips";
import { createCanonicalUrl } from "@/lib/seo";

// Built without the API reachable, so refresh at runtime to pick up trips.
export const revalidate = 3600;

const PAGE_SIZE = 50;

async function fetchPublicTrips(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000";
  const entries: MetadataRoute.Sitemap = [];

  try {
    let hasMore = true;
    while (hasMore) {
      const res = await fetch(
        `${baseUrl}/api/v1/trips/discover?limit=${PAGE_SIZE}&skip=${entries.length}`,
      );
      if (!res.ok) break;
      const { data } = (await res.json()) as ApiResponse<DiscoverTripsResponse>;
      for (const trip of data.trips) {
        entries.push({
          url: createCanonicalUrl(`/public/${trip._id}`),
          lastModified: trip.updatedAt,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
      hasMore = data.hasMore && data.trips.length > 0;
    }
  } catch (error) {
    console.error("Sitemap: failed to fetch public trips:", error);
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: createCanonicalUrl("/"), changeFrequency: "monthly", priority: 1 },
    {
      url: createCanonicalUrl("/discover"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: createCanonicalUrl("/story"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: createCanonicalUrl("/privacy"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: createCanonicalUrl("/terms"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  return [...staticPages, ...(await fetchPublicTrips())];
}
