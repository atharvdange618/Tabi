"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import {
  useExpenses,
  useCreateExpense,
  useDeleteExpense,
} from "../../hooks/useBudget";
import { useMembers } from "../../hooks/useMembers";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createExpenseSchema,
  type CreateExpensePayload,
  expenseCategories,
} from "shared/validations";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useState } from "react";
import { BudgetSettingsCard } from "./BudgetSettingsCard";
import { SplitsSection } from "./SplitsSection";

const BudgetSummaryChart = dynamic(
  () =>
    import("./BudgetCharts").then((m) => ({ default: m.BudgetSummaryChart })),
  {
    ssr: false,
    loading: () => (
      <div className="brutal-card rounded-lg p-6 animate-pulse">
        <div className="h-48 bg-gray-200 rounded" />
      </div>
    ),
  },
);

const CATEGORY_COLORS: Record<string, string> = {
  accommodation: "#93CDFF",
  food: "#FFD6C0",
  transport: "#FFF3B0",
  activities: "#B8F0D4",
  shopping: "#FFB8B8",
  misc: "#E5E7EB",
};

export default function BudgetContent() {
  const params = useParams<{ id: string }>();
  const { data: members } = useMembers(params.id);
  const { data: expenses, isLoading } = useExpenses(params.id);
  const createExpense = useCreateExpense(params.id);
  const deleteExpense = useDeleteExpense(params.id);
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateExpensePayload>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: { category: "food" },
  });

  function onSubmit(data: CreateExpensePayload) {
    createExpense.mutate(data, {
      onSuccess: () => {
        reset();
        setShowForm(false);
      },
    });
  }

  return (
    <div className="space-y-6">
      <BudgetSettingsCard tripId={params.id} />
      <BudgetSummaryChart tripId={params.id} />

      {/* Expenses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-extrabold text-lg uppercase tracking-tight">
            Expenses
          </h3>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="brutal-button bg-brand-blue px-4 py-2 rounded-md text-sm inline-flex items-center gap-2 h-auto"
          >
            <Plus size={14} />
            Add Expense
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="brutal-card rounded-lg p-5 mb-4 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Input
                  {...register("description")}
                  placeholder="Description"
                  className="brutal-input w-full px-3 py-2 rounded-md text-sm font-body focus:outline-none"
                />
                {errors.description && (
                  <p className="text-xs text-brand-coral mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>
              <div>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  {...register("amount", { valueAsNumber: true })}
                  placeholder="Amount (₹)"
                  className="brutal-input w-full px-3 py-2 rounded-md text-sm font-body focus:outline-none"
                />
                {errors.amount && (
                  <p className="text-xs text-brand-coral mt-1">
                    {errors.amount.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="brutal-input w-full px-3 py-2 rounded-md text-sm font-body focus:outline-none h-auto">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Controller
                control={control}
                name="paidBy"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <SelectTrigger className="brutal-input w-full px-3 py-2 rounded-md text-sm font-body focus:outline-none h-auto">
                      <SelectValue placeholder="Paid by (Select user)" />
                    </SelectTrigger>
                    <SelectContent>
                      {members?.active?.map((m) => (
                        <SelectItem key={m.userId._id} value={m.userId._id}>
                          {m.userId.name || m.userId.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-muted-foreground hover:bg-transparent p-0 h-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createExpense.isPending}
                className="brutal-button bg-brand-mint px-4 py-2 rounded-md text-sm disabled:opacity-50 h-auto"
              >
                {createExpense.isPending ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="brutal-card rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : !expenses || expenses.length === 0 ? (
          <div className="border-2 border-dashed border-[#1a1a1a]/20 rounded-xl p-8 text-center">
            <p className="text-sm font-body text-muted-foreground">
              No expenses recorded yet. Add your first expense.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => {
              const payer = members?.active?.find(
                (m) => m.userId._id === exp.paidBy,
              );
              const payerName =
                payer?.userId.name || payer?.userId.email || "Unknown";
              return (
                <div
                  key={exp._id}
                  className="brutal-card rounded-lg p-4 flex items-center gap-4"
                >
                  <div
                    className="w-3 h-3 rounded-sm border-2 border-brutal-border shrink-0"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[exp.category] || "#E5E7EB",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-body truncate">
                      {exp.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {exp.category} &middot; paid by {payerName}
                    </p>
                  </div>
                  <span className="text-sm font-bold font-mono">
                    ₹{exp.amount.toLocaleString("en-IN")}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => deleteExpense.mutate(exp._id)}
                    className="p-1.5 text-muted-foreground hover:text-brand-coral hover:bg-transparent transition-colors size-auto"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SplitsSection tripId={params.id} />
    </div>
  );
}
