import type { Metadata } from "next";
import SettingsContent from "../../../../components/settings/SettingsContent";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your trip settings.",
};

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold font-display mb-6">Settings</h1>
      <SettingsContent />
    </div>
  );
}
