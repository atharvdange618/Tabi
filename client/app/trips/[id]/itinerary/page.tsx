import type { Metadata } from "next";
import ItineraryContent from "../../../../components/itinerary/ItineraryContent";

export const metadata: Metadata = {
  title: "Itinerary",
  description: "Day-by-day itinerary for your trip.",
};

export default function ItineraryPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold font-display mb-6">Itinerary</h1>
      <ItineraryContent />
    </div>
  );
}
