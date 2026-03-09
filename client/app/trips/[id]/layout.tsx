import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { generateOGImageUrl, SITE_NAME } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const { getToken } = await auth();
    const token = await getToken();
    if (token) {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/v1/trips/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const { data: trip } = await res.json();
        if (trip?.title) {
          const description = trip.destination
            ? `Collaborative trip to ${trip.destination}`
            : "A collaborative trip on Tabi";

          return {
            title: trip.title,
            description,
            robots: {
              index: false,
              follow: false,
            },
            openGraph: {
              title: `${trip.title} | ${SITE_NAME}`,
              description,
              images: [
                {
                  url: generateOGImageUrl({
                    title: trip.title,
                    description: trip.destination || description,
                    coverImage: trip.coverImageUrl,
                  }),
                  width: 1200,
                  height: 630,
                  alt: trip.title,
                },
              ],
            },
            twitter: {
              card: "summary_large_image",
              title: `${trip.title} | ${SITE_NAME}`,
              description,
              images: [
                generateOGImageUrl({
                  title: trip.title,
                  description: trip.destination || description,
                  coverImage: trip.coverImageUrl,
                }),
              ],
            },
          };
        }
      }
    }
  } catch {}
  return {
    title: "Trip Details",
    description: "Manage your trip itinerary, budget, and more.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function TripLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
