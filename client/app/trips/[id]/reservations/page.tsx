import type { Metadata } from "next";
import ReservationsContent from "../../../../components/shared/ReservationsContent";

export const metadata: Metadata = {
  title: "Reservations",
  description: "Manage hotel, flight, and activity reservations for your trip.",
};

export default function ReservationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold font-display mb-6">Reservations</h1>
      <ReservationsContent />
    </div>
  );
}
