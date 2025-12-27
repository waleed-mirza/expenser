"use client";

import { useEffect, useState } from "react";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { TrendingUp, TrendingDown, Target, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";

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
      // Ensure start date is at the beginning of the day (00:00:00)
      const startDateObj = start ? new Date(start + "T00:00:00") : new Date();
      // Ensure end date is at the end of the day (23:59:59.999)
      const endDateObj = end ? new Date(end + "T23:59:59.999") : new Date();
      
      const qs = new URLSearchParams({
        start: startDateObj.toISOString(),
        end: endDateObj.toISOString(),
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

  const formatDateRange = () => {
    try {
      const startFormatted = start ? format(parseISO(start), "MMM d, yyyy") : "";
      const endFormatted = end ? format(parseISO(end), "MMM d, yyyy") : "";
      if (startFormatted && endFormatted) {
        return `${startFormatted} - ${endFormatted}`;
      }
      return null;
    } catch {
      return null;
    }
  };

  const dateRangeText = formatDateRange();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8"
    >
      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border-2 border-border/50 bg-card/60 backdrop-blur-xl p-6 shadow-xl"
      >
        <div className="flex flex-wrap items-end gap-4 mb-4">
        <label className="text-sm font-medium text-foreground">
          Start
          <input
            type="date"
            className="mt-2 block rounded-xl border-2 border-border/50 bg-background/60 backdrop-blur-sm px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label className="text-sm font-medium text-foreground">
          End
          <input
            type="date"
            className="mt-2 block rounded-xl border-2 border-border/50 bg-background/60 backdrop-blur-sm px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
          <motion.button
            type="button"
            onClick={load}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {loading ? "Loading..." : "Apply Range"}
          </motion.button>
        </div>
        {dateRangeText && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              {summary ? (
                <>Showing results for: <span className="font-medium text-foreground">{dateRangeText}</span></>
              ) : (
                <>Date range: <span className="font-medium text-foreground">{dateRangeText}</span></>
              )}
            </p>
          </div>
        )}
      </motion.div>

      {error && <div className="text-sm text-destructive font-medium px-1">{error}</div>}

      {summary && (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <InsightCard
              index={0}
              title="Total Spent"
              value={`${total.toLocaleString()} PKR`}
              subtext={
                prevTotal > 0 ? (
                  <span className={percentChange > 0 ? "text-red-500 font-bold" : "text-emerald-500 font-bold"}>
                     {percentChange > 0 ? "+" : ""}{percentChange.toFixed(1)}% vs previous
                  </span>
                ) : "vs previous period"
              }
              icon={<Wallet className="h-5 w-5" />}
            />
            
            <InsightCard
              index={1}
              title="Daily Average"
              value={`${dailyAvg.toFixed(2)} PKR`}
              subtext="Average burn rate"
              icon={<TrendingUp className="h-5 w-5" />}
            />

            <InsightCard
              index={2}
              title="30-Day Projection"
              value={`${projected30Day.toLocaleString()} PKR`}
              subtext="Forecast based on current rate"
              icon={<Target className="h-5 w-5" />}
            />

            <InsightCard
              index={3}
              title="Largest Expense"
              value={summary.topExpense ? `${(summary.topExpense.amountCents/100).toLocaleString()} PKR` : "0 PKR"}
              subtext={summary.topExpense?.note || "No data"}
              icon={<TrendingDown className="h-5 w-5" />}
            />
          </div>

          {/* Charts Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border-2 border-border/50 bg-card/60 backdrop-blur-xl p-6 shadow-xl"
          >
            <AnalyticsCharts start={start} end={end} />
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

function InsightCard({ title, value, subtext, icon, index }: { title: string; value: string; subtext: React.ReactNode; icon: React.ReactNode; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index ?? 0) * 0.1, duration: 0.5 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="rounded-2xl border-2 border-border/50 bg-card/60 backdrop-blur-xl p-6 shadow-lg transition-all hover:shadow-2xl hover:border-primary/40 overflow-hidden relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</h3>
        <motion.div
          whileHover={{ rotate: 10, scale: 1.1 }}
          className="rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 p-3 text-primary shadow-md"
        >
          {icon}
        </motion.div>
      </div>
      <div className="text-2xl font-semibold text-foreground relative z-10 mb-2">
        {value}
      </div>
      <p className="mt-1 text-xs text-muted-foreground truncate relative z-10">{subtext}</p>
    </motion.div>
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
