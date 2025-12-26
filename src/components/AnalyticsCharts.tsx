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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">
          Weekly totals (PKR)
        </h3>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey={(d) =>
                  new Date(d.week_start).toLocaleDateString("en-PK", {
                    month: "short",
                    day: "numeric",
                  })
                }
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${(v / 100).toFixed(0)}`}
              />
              <Tooltip
                formatter={(v: number) => `${(Number(v) / 100).toFixed(2)} PKR`}
              />
              <Bar
                dataKey={(d) => Number(d.expense_cents || 0)}
                name="Expenses"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
