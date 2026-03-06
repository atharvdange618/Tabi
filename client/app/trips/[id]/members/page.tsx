import type { Metadata } from "next";
import MembersContent from "../../../../components/members/MembersContent";

export const metadata: Metadata = {
  title: "Members",
  description: "Manage trip members and invite collaborators.",
};

export default function MembersPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold font-display mb-6">Members</h1>
      <MembersContent />
    </div>
  );
}
