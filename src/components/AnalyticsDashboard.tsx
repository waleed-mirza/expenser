"use client";

import { useEffect, useState } from "react";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { TrendingUp, TrendingDown, Target, Wallet } from "lucide-react";

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
  previous?: {
    expenseCents: number;
  };
  days: number;
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

  // Calculate Insights
  const total = summary ? summary.expenseCents / 100 : 0;
  const prevTotal = summary?.previous ? summary.previous.expenseCents / 100 : 0;
  const percentChange = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
  
  // Projection (Burn Rate)
  // Simple projection: (Total / Days passed) * 30 days
  // Or better, if the range is "This Month", project to end of month.
  // For simplicity, let's just project based on the current range's daily average extended to 30 days
  const dailyAvg = summary ? summary.avgDailyExpenseCents / 100 : 0;
  const projected30Day = dailyAvg * 30;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        <label className="text-sm font-medium text-muted-foreground">
          Start
          <input
            type="date"
            className="mt-1 block rounded-md border border-input bg-background/50 px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="text-sm font-medium text-muted-foreground">
          End
          <input
            type="date"
            className="mt-1 block rounded-md border border-input bg-background/50 px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 mb-[1px] text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {loading ? "Loading..." : "Apply Range"}
        </button>
      </div>

      {error && <div className="text-sm text-destructive font-medium px-1">{error}</div>}

      {summary && (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InsightCard
              title="Total Spent"
              value={`${total.toLocaleString()} PKR`}
              subtext={
                prevTotal > 0 ? (
                  <span className={percentChange > 0 ? "text-red-500" : "text-emerald-500"}>
                     {percentChange > 0 ? "+" : ""}{percentChange.toFixed(1)}% vs previous
                  </span>
                ) : "vs previous period"
              }
              icon={<Wallet className="h-4 w-4" />}
            />
            
            <InsightCard
              title="Daily Average"
              value={`${dailyAvg.toFixed(2)} PKR`}
              subtext="Average burn rate"
              icon={<TrendingUp className="h-4 w-4" />}
            />

            <InsightCard
              title="30-Day Projection"
              value={`${projected30Day.toLocaleString()} PKR`}
              subtext="Forecast based on current rate"
              icon={<Target className="h-4 w-4" />}
            />

             <InsightCard
              title="Largest Expense"
              value={summary.topExpense ? `${(summary.topExpense.amountCents/100).toLocaleString()}` : "0"}
              subtext={summary.topExpense?.note || "No data"}
              icon={<TrendingDown className="h-4 w-4" />}
            />
          </div>

          {/* Charts Grid */}
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
             <AnalyticsCharts start={start} end={end} />
          </div>
        </>
      )}
    </div>
  );
}

function InsightCard({ title, value, subtext, icon }: { title: string; value: string; subtext: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground truncate">{subtext}</p>
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
