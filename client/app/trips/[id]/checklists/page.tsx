import type { Metadata } from "next";
import ChecklistsContent from "../../../../components/shared/ChecklistsContent";

export const metadata: Metadata = {
  title: "Checklists",
  description: "Packing lists and group to-dos for your trip.",
};

export default function ChecklistsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold font-display mb-6">Checklists</h1>
      <ChecklistsContent />
    </div>
  );
}
