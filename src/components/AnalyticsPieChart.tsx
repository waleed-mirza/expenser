"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

type CategoryData = {
  category: string;
  color: string;
  total_cents: number;
};

export function AnalyticsPieChart({ start, end }: { start: string; end: string }) {
  const [data, setData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ start, end });
    fetch(`/api/analytics/category?${qs.toString()}`)
      .then((res) => (res.ok ? res.json() : { rows: [] }))
      .then((json) => setData(json.rows || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [start, end]);

  const chartData = data.map((d) => ({
    name: d.category,
    value: d.total_cents / 100, // convert to units
    color: d.color,
  }));

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-muted/20" />;
  if (chartData.length === 0)
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-border/50 bg-card text-muted-foreground">
        No category data available
      </div>
    );

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Spending by Category
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => `${value.toFixed(2)} PKR`}
              contentStyle={{
                backgroundColor: "var(--color-card)",
                borderColor: "var(--color-border)",
                borderRadius: "8px",
                color: "var(--color-foreground)",
              }}
              itemStyle={{ color: "var(--color-foreground)" }}
            />
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right"
              wrapperStyle={{ fontSize: "12px" }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
