"use client";

import { useState } from "react";
import { format } from "date-fns";
import { BadgeIndianRupee, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { brutalBtnSm } from "./_shared";
import {
  useExpenses,
  useBudgetSummary,
  useCreateExpense,
  useDeleteExpense,
} from "@/hooks/useBudget";
import { useMembers } from "@/hooks/useMembers";
import { SplitsSection } from "@/components/budget/SplitsSection";
import type { PopulatedExpense } from "shared/types";
import { expenseCategories } from "shared/validations";

const categoryColors: Record<string, string> = {
  accommodation: "bg-brand-peach",
  food: "bg-brand-lemon",
  transport: "bg-brand-blue",
  activities: "bg-brand-mint",
  shopping: "bg-[#e5e7eb]",
  misc: "bg-[#e5e7eb]",
};

export function BudgetTab({
  tripId,
  canEdit,
}: {
  tripId: string;
  canEdit: boolean;
}) {
  const { data: summary } = useBudgetSummary(tripId);
  const { data: rawExpenses = [] } = useExpenses(tripId);
  const { data: membersData } = useMembers(tripId);
  const deleteExpense = useDeleteExpense(tripId);
  const createExpense = useCreateExpense(tripId);

  const expenses = rawExpenses as unknown as PopulatedExpense[];

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "misc",
    paidBy: "",
    date: "",
  });

  const pct = summary
    ? Math.min(
        100,
        Math.round((summary.totalSpent / (summary.totalBudget || 1)) * 100),
      )
    : 0;

  function submitAdd() {
    createExpense.mutate(
      {
        description: form.description,
        amount: parseFloat(form.amount),
        category: form.category as PopulatedExpense["category"],
        paidBy: form.paidBy,
        date: form.date || undefined,
      },
      {
        onSuccess: () => {
          setAddOpen(false);
          setForm({
            description: "",
            amount: "",
            category: "misc",
            paidBy: "",
            date: "",
          });
        },
      },
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="space-y-4">
        <div className="bg-brand-blue border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider mb-3">
            Budget Overview
          </p>
          <p className="font-display font-black text-3xl tracking-tight mb-0.5">
            ₹{(summary?.totalSpent ?? 0).toLocaleString()}
          </p>
          <p className="text-xs font-medium text-[#374151] mb-4">
            of ₹{(summary?.totalBudget ?? 0).toLocaleString()} total
          </p>
          <div className="bg-white/40 rounded-full overflow-hidden h-2.5 border border-[#1A1A1A]">
            <div
              className="h-full bg-[#111] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs font-bold mt-2">
            {pct}% spent · ₹{(summary?.remaining ?? 0).toLocaleString()}{" "}
            remaining
          </p>
        </div>

        <div className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-3">
            By category
          </p>
          {summary?.byCategory
            ? Object.entries(summary.byCategory).map(([cat, amount]) => {
                if (!amount) return null;
                const pctCat = Math.round(
                  ((amount as number) / (summary.totalBudget || 1)) * 100,
                );
                return (
                  <div key={cat} className="mb-3 last:mb-0">
                    <div className="flex justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full border border-[#1A1A1A]",
                            categoryColors[cat] ?? "bg-[#e5e7eb]",
                          )}
                        />
                        <span className="text-xs font-semibold capitalize">
                          {cat}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-[#6B7280]">
                        ₹{(amount as number).toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={pctCat}
                      className="h-1.5 bg-[#e5e7eb] [&>div]:bg-[#111]"
                    />
                  </div>
                );
              })
            : null}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-5">
        <div className="flex items-center justify-between">
          <p className="font-display font-bold text-base">All expenses</p>
          {canEdit && (
            <Button
              size="sm"
              className={cn(brutalBtnSm, "gap-1")}
              onClick={() => setAddOpen(true)}
            >
              <Plus size={12} />
              Add expense
            </Button>
          )}
        </div>

        <div className="space-y-2.5">
          {expenses.map((exp) => (
            <div
              key={exp._id}
              className="group flex items-center gap-3 bg-white border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] rounded-xl p-4 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] transition-all duration-150"
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-lg border-2 border-[#1A1A1A] flex items-center justify-center shrink-0",
                  categoryColors[exp.category] ?? "bg-brand-lemon",
                )}
              >
                <BadgeIndianRupee size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {exp.description}
                </p>
                <p className="text-[11px] text-[#9CA3AF] font-medium">
                  Paid by{" "}
                  {typeof exp.paidBy === "object"
                    ? exp.paidBy.name
                    : exp.paidBy}
                  {exp.date ? ` · ${format(new Date(exp.date), "MMM d")}` : ""}
                </p>
              </div>
              <p className="font-display font-bold text-sm shrink-0">
                ₹{exp.amount.toLocaleString()}
              </p>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 border border-transparent hover:border-red-300 rounded transition-all"
                  onClick={() => deleteExpense.mutate(exp._id)}
                >
                  <Trash2 size={11} className="text-red-500" />
                </Button>
              )}
            </div>
          ))}
          {!expenses.length && (
            <p className="text-sm text-[#9CA3AF] font-medium text-center py-8">
              No expenses yet.
            </p>
          )}
        </div>

        <div className="border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl overflow-hidden">
          <SplitsSection tripId={tripId} canEdit={canEdit} />
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="border-2 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-xl uppercase">
              Add Expense
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">
                Description *
              </Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="mt-1 border-2 border-[#1A1A1A] rounded-lg"
                placeholder="What was this for?"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">
                Amount (₹) *
              </Label>
              <Input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                className="mt-1 border-2 border-[#1A1A1A] rounded-lg"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">
                Category
              </Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger className="mt-1 border-2 border-[#1A1A1A] rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-2 border-[#1A1A1A] rounded-xl shadow-[4px_4px_0px_#1A1A1A]">
                  {expenseCategories.map((c) => (
                    <SelectItem
                      key={c}
                      value={c}
                      className="capitalize text-sm"
                    >
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">
                Paid by
              </Label>
              <Select
                value={form.paidBy}
                onValueChange={(v) => setForm({ ...form, paidBy: v })}
              >
                <SelectTrigger className="mt-1 border-2 border-[#1A1A1A] rounded-lg">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent className="border-2 border-[#1A1A1A] rounded-xl shadow-[4px_4px_0px_#1A1A1A]">
                  {membersData?.active.map((m) => (
                    <SelectItem
                      key={m._id}
                      value={m.userId?._id ?? m._id}
                      className="text-sm"
                    >
                      {m.userId?.name ?? m._id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">
                Date (optional)
              </Label>
              <DatePicker
                value={form.date}
                onChange={(date) => setForm({ ...form, date })}
                placeholder="Select date"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              className="border-2 border-[#1A1A1A] rounded-lg font-bold"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={
                !form.description.trim() ||
                !form.amount ||
                !form.paidBy ||
                createExpense.isPending
              }
              onClick={submitAdd}
              className="bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] hover:bg-brand-blue transition-all duration-150 rounded-lg"
            >
              {createExpense.isPending ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
