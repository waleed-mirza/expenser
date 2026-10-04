"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact, formatMoney } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

type WeeklyRow = {
  week_start: string;
  expense_cents?: number | string;
};

const weekLabel = (iso: string, long = false) =>
  // week_start is a wall-clock value labelled UTC, so format it as UTC.
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    ...(long ? { year: "numeric" } : {}),
  });

export function AnalyticsCharts({
  startISO,
  endISO,
  tz,
}: {
  startISO: string;
  endISO: string;
  tz: string;
}) {
  const [weekly, setWeekly] = useState<WeeklyRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const qs = new URLSearchParams({ tz, start: startISO, end: endISO });
    fetch(`/api/analytics/weekly?${qs}`, { signal: ctrl.signal, credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("network"))))
      .then((data) => {
        setWeekly(data?.weeks ?? []);
        setFailed(false);
      })
      .catch(() => {
        if (ctrl.signal.aborted) return;
        setWeekly([]);
        setFailed(true);
      });
    return () => ctrl.abort();
  }, [startISO, endISO, tz]);

  const data = useMemo(
    () =>
      (weekly ?? []).map((w) => ({
        start: w.week_start,
        label: weekLabel(w.week_start),
        cents: Number(w.expense_cents || 0),
      })),
    [weekly]
  );

  return (
    <section
      aria-label="Weekly totals"
      className="rounded-2xl border border-border bg-card p-4"
    >
      <h2 className="mb-3 text-base font-bold">Weekly totals</h2>
      {weekly === null ? (
        <Skeleton className="h-56 w-full" />
      ) : failed ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Couldn&apos;t load the chart.
        </p>
      ) : data.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No expenses in this range.
        </p>
      ) : (
        <div className="h-56" role="img" aria-label={`Bar chart of ${data.length} weekly totals`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickFormatter={(v) => formatCompact(Number(v))}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                formatter={(v) => [formatMoney(Number(v)), "Spent"]}
                labelFormatter={(_, payload) =>
                  payload?.[0]
                    ? `Week of ${weekLabel(payload[0].payload.start, true)}`
                    : ""
                }
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                  color: "var(--foreground)",
                }}
                labelStyle={{ color: "var(--muted-foreground)" }}
                itemStyle={{ color: "var(--foreground)" }}
              />
              <Bar
                dataKey="cents"
                name="Spent"
                fill="var(--primary)"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
