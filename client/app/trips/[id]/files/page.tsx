import type { Metadata } from "next";
import FilesContent from "../../../../components/shared/FilesContent";

export const metadata: Metadata = {
  title: "Files",
  description: "Trip documents, tickets, and uploaded files.",
};

export default function FilesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold font-display mb-6">Files</h1>
      <FilesContent />
    </div>
  );
}
