import type { Metadata } from "next";
import BudgetContent from "../../../../components/budget/BudgetContent";

export const metadata: Metadata = {
  title: "Budget",
  description: "Track trip expenses and split costs among members.",
};

export default function BudgetPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold font-display mb-6">Budget</h1>
      <BudgetContent />
    </div>
  );
}
