import { redirect } from "next/navigation";

export default function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return redirect(`/trips/${params}/itinerary`);
}
