"use client";

import { useParams } from "next/navigation";
import {
  useBudgetSettings,
  useUpdateBudgetSettings,
  useExpenses,
  useBudgetSummary,
  useCreateExpense,
  useDeleteExpense,
} from "../../hooks/useBudget";
import { useMembers } from "../../hooks/useMembers";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createExpenseSchema,
  updateBudgetSettingsSchema,
  type CreateExpensePayload,
  type UpdateBudgetSettingsPayload,
  expenseCategories,
} from "../../../shared/validations";
import { Plus, Trash2, Wallet, TrendingUp, TrendingDown } from "lucide-react";
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
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  accommodation: "#93CDFF",
  food: "#FFD6C0",
  transport: "#FFF3B0",
  activities: "#B8F0D4",
  shopping: "#FFB8B8",
  misc: "#E5E7EB",
};

function BudgetSettingsCard({ tripId }: { tripId: string }) {
  const { data: settings } = useBudgetSettings(tripId);
  const updateSettings = useUpdateBudgetSettings(tripId);
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateBudgetSettingsPayload>({
    resolver: zodResolver(updateBudgetSettingsSchema),
    values: { totalBudget: settings?.totalBudget ?? 0 },
  });

  function onSubmit(data: UpdateBudgetSettingsPayload) {
    updateSettings.mutate(data, { onSuccess: () => setEditing(false) });
  }

  return (
    <div className="brutal-card rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold font-display flex items-center gap-2">
          <Wallet size={16} />
          Budget Settings
        </h3>
        {!editing && (
          <Button
            variant="ghost"
            onClick={() => setEditing(true)}
            className="text-xs text-brand-blue hover:underline hover:bg-transparent h-auto p-0"
          >
            Edit
          </Button>
        )}
      </div>
      {editing ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex items-center gap-3"
        >
          <Input
            type="number"
            {...register("totalBudget", { valueAsNumber: true })}
            className="brutal-input px-3 py-2 rounded-md text-sm font-body w-40 focus:outline-none"
          />
          <span className="text-sm text-muted-foreground font-mono">INR</span>
          <Button
            type="submit"
            disabled={updateSettings.isPending}
            className="brutal-button bg-brand-mint px-3 py-1.5 rounded-md text-xs h-auto"
          >
            Save
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs text-muted-foreground hover:bg-transparent h-auto p-0"
          >
            Cancel
          </Button>
          {errors.totalBudget && (
            <p className="text-xs text-brand-coral">
              {errors.totalBudget.message}
            </p>
          )}
        </form>
      ) : (
        <p className="text-2xl font-bold font-display">
          ₹{(settings?.totalBudget ?? 0).toLocaleString("en-IN")}
        </p>
      )}
    </div>
  );
}

function BudgetSummaryChart({ tripId }: { tripId: string }) {
  const { data: summary, isLoading } = useBudgetSummary(tripId);

  if (isLoading || !summary) {
    return (
      <div className="brutal-card rounded-lg p-6 animate-pulse">
        <div className="h-48 bg-gray-200 rounded" />
      </div>
    );
  }

  const pieData = Object.entries(summary.byCategory)
    .filter(([, val]) => val > 0)
    .map(([key, val]) => ({ name: key, value: val }));

  const barData = [
    { name: "Spent", value: summary.totalSpent, fill: "#FFB8B8" },
    {
      name: "Remaining",
      value: Math.max(0, summary.remaining),
      fill: "#B8F0D4",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Overview */}
      <div className="brutal-card rounded-lg p-5">
        <h3 className="text-sm font-semibold font-display mb-4">Overview</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p className="text-lg font-bold font-display flex items-center gap-1">
              <TrendingDown size={14} className="text-brand-coral" />₹
              {summary.totalSpent.toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="text-lg font-bold font-display flex items-center gap-1">
              <TrendingUp size={14} className="text-brand-mint" />₹
              {Math.max(0, summary.remaining).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={barData} layout="vertical">
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              tick={{ fontSize: 12 }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {barData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.fill}
                  stroke="#1A1A1A"
                  strokeWidth={1.5}
                />
              ))}
            </Bar>
            <Tooltip
              formatter={(val) => `₹${(val ?? 0).toLocaleString("en-IN")}`}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown */}
      <div className="brutal-card rounded-lg p-5">
        <h3 className="text-sm font-semibold font-display mb-4">By Category</h3>
        {pieData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No expenses recorded yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                strokeWidth={2}
                stroke="#1A1A1A"
                label={({
                  name,
                  percent,
                  x,
                  y,
                  textAnchor,
                  dominantBaseline,
                }) => (
                  <text
                    x={x}
                    y={y}
                    fill="black"
                    textAnchor={textAnchor}
                    dominantBaseline={dominantBaseline}
                  >
                    {`${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  </text>
                )}
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORY_COLORS[entry.name] || "#E5E7EB"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(val) => `₹${(val ?? 0).toLocaleString("en-IN")}`}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

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
          <h3 className="text-lg font-semibold font-display">Expenses</h3>
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
          <div className="brutal-card rounded-lg p-8 text-center">
            <p className="text-muted-foreground font-body">
              No expenses recorded yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => (
              <div
                key={exp._id}
                className="brutal-card rounded-lg p-4 flex items-center gap-4"
              >
                <div
                  className="w-3 h-3 rounded-full border border-brutal-border shrink-0"
                  style={{
                    backgroundColor: CATEGORY_COLORS[exp.category] || "#E5E7EB",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium font-body truncate">
                    {exp.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {exp.category}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
