"use client";

import { useEffect, useState } from "react";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";

type Summary = {
  range: { start: string; end: string; tz: string };
  expenseCents: number;
  avgDailyExpenseCents: number;
  expenseCount: number;
  topExpense: {
    amountCents: number;
    note: string | null;
    occurredAt: string;
    currencyCode?: string | null;
  } | null;
};

export function AnalyticsDashboard() {
  const [start, setStart] = useState(() =>
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
      });
      const res = await fetch(`/api/analytics/summary?${qs.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch summary");
      const json = (await res.json()) as Summary;
      setSummary(json);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load analytics";
      setError(message);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rangeLabel = summary
    ? `${new Date(summary.range.start).toLocaleDateString()} – ${new Date(
        summary.range.end
      ).toLocaleDateString()}`
    : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium text-slate-200">
          Start
          <input
            type="date"
            className="mt-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="text-sm font-medium text-slate-200">
          End
          <input
            type="date"
            className="mt-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
        >
          {loading ? "Loading..." : "Apply"}
        </button>
        {summary && (
          <span className="text-xs text-slate-300">Range: {rangeLabel}</span>
        )}
        {error && <span className="text-xs text-amber-300">{error}</span>}
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total expenses"
            value={summary.expenseCents}
            tone="red"
          />
          <StatCard
            label="Avg daily spend"
            value={summary.avgDailyExpenseCents}
            tone="slate"
          />
          <StatCard
            label="Expenses count"
            value={summary.expenseCount}
            tone="slate"
            asCount
          />
          {summary.topExpense && (
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <p className="text-sm font-medium text-slate-700">
                Largest expense
              </p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {(summary.topExpense.amountCents / 100).toFixed(2)}{" "}
                {summary.topExpense.currencyCode ?? "PKR"}
              </p>
              {summary.topExpense.note && (
                <p className="text-sm text-slate-600">
                  {summary.topExpense.note}
                </p>
              )}
              <p className="text-xs text-slate-500">
                {new Date(summary.topExpense.occurredAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      <AnalyticsCharts start={start} end={end} />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  asCount,
}: {
  label: string;
  value: number;
  tone: "red" | "green" | "indigo" | "slate";
  asCount?: boolean;
}) {
  const colorMap: Record<typeof tone, string> = {
    red: "text-red-600",
    green: "text-emerald-600",
    indigo: "text-indigo-600",
    slate: "text-slate-800",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-center shadow-sm">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[tone]}`}>
        {asCount ? value : (value / 100).toFixed(2)} {asCount ? "" : "PKR"}
      </p>
    </div>
  );
}
