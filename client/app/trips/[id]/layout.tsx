import type { Metadata } from "next";
import TripSidebar from "../../../components/shared/TripSidebar";
import { auth } from "@clerk/nextjs/server";

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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/trips/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          next: { revalidate: 60 },
        },
      );

      if (res.ok) {
        const payload = await res.json();
        const trip = payload.data;
        if (trip && trip.title) {
          return {
            title: `${trip.title}`,
            description: trip.destination
              ? `Collaborative trip to ${trip.destination}`
              : "A collaborative trip on Tabi",
            openGraph: {
              title: `${trip.title} | Tabi`,
              description: trip.destination
                ? `Collaborative trip to ${trip.destination}`
                : "A collaborative trip on Tabi",
            },
          };
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch trip metadata:", error);
  }

  return {
    title: "Trip Details",
    description: "Manage your trip itinerary, budget, and more.",
  };
}

export default function TripLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-brand-cream">
      <TripSidebar />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
