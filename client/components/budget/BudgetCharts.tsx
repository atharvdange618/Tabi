"use client";

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
import { TrendingDown, TrendingUp } from "lucide-react";
import { useBudgetSummary } from "../../hooks/useBudget";

const CATEGORY_COLORS: Record<string, string> = {
  accommodation: "#93CDFF",
  food: "#FFD6C0",
  transport: "#FFF3B0",
  activities: "#B8F0D4",
  shopping: "#FFB8B8",
  misc: "#E5E7EB",
};

export function BudgetSummaryChart({ tripId }: { tripId: string }) {
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
