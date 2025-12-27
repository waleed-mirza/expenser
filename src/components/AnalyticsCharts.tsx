"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";

type WeeklyRow = {
  week_start: string;
  expense_cents?: number | string;
};

export function AnalyticsCharts({
  start,
  end,
}: {
  start: string;
  end: string;
}) {
  const [weekly, setWeekly] = useState<WeeklyRow[]>([]);

  useEffect(() => {
    const qs = new URLSearchParams({
      tz: "Asia/Karachi",
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
    });
    fetch(`/api/analytics/weekly?${qs.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setWeekly(data?.weeks ?? []))
      .catch(() => setWeekly([]));
  }, [start, end]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.02 }}
        className="rounded-2xl border-2 border-border/50 bg-card/40 backdrop-blur-sm p-6 shadow-lg"
      >
        <h3 className="text-base font-bold text-foreground mb-4">
          Weekly totals (PKR)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey={(d) =>
                  new Date(d.week_start).toLocaleDateString("en-PK", {
                    month: "short",
                    day: "numeric",
                  })
                }
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                stroke="hsl(var(--border))"
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${(v / 100).toFixed(0)}`}
                stroke="hsl(var(--border))"
              />
              <Tooltip
                formatter={(v: number) => `${(Number(v) / 100).toFixed(2)} PKR`}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.75rem",
                }}
              />
              <Bar
                dataKey={(d) => Number(d.expense_cents || 0)}
                name="Expenses"
                fill="url(#colorGradient)"
                radius={[8, 8, 0, 0]}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="rgb(139, 92, 246)" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
