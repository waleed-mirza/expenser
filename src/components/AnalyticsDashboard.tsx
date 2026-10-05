"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  endOfDay,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import { ArrowDownRight, ArrowUpRight, WifiOff } from "lucide-react";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { toDateInputValue } from "@/lib/transactions";
import { DEFAULT_TZ } from "@/lib/time";

type Summary = {
  expenseCents: number;
  avgDailyExpenseCents: number;
  expenseCount: number;
  topExpense: {
    amountCents: number;
    note: string | null;
    occurredAt: string;
    currencyCode?: string | null;
  } | null;
  previous?: { expenseCents: number };
  days: number;
};

type Preset = "7d" | "30d" | "90d" | "month" | "custom";

const PRESETS: { key: Preset; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "month", label: "This month" },
  { key: "custom", label: "Custom" },
];

function presetRange(preset: Preset, customStart: string, customEnd: string) {
  const now = new Date();
  switch (preset) {
    case "7d":
      return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
    case "90d":
      return { start: startOfDay(subDays(now, 89)), end: endOfDay(now) };
    case "month":
      return { start: startOfMonth(now), end: endOfDay(now) };
    case "custom":
      return customStart && customEnd && customStart <= customEnd
        ? { start: startOfDay(parseISO(customStart)), end: endOfDay(parseISO(customEnd)) }
        : null;
    default:
      return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
  }
}

export function AnalyticsDashboard() {
  const { data: session } = useSession();
  const tz = session?.user?.timezone || DEFAULT_TZ;

  const [preset, setPreset] = useState<Preset>("30d");
  const [customStart, setCustomStart] = useState(() =>
    toDateInputValue(subDays(new Date(), 29))
  );
  const [customEnd, setCustomEnd] = useState(() => toDateInputValue(new Date()));
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  // Stable ISO strings for the effect/children; `preset` fully determines the range.
  const range = useMemo(() => {
    const r = presetRange(preset, customStart, customEnd);
    return r && { startISO: r.start.toISOString(), endISO: r.end.toISOString() };
  }, [preset, customStart, customEnd]);

  useEffect(() => {
    if (!range) return;
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({
          tz,
          start: range.startISO,
          end: range.endISO,
        });
        const res = await fetch(`/api/analytics/summary?${qs}`, {
          credentials: "include",
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("network");
        setSummary((await res.json()) as Summary);
      } catch {
        if (ctrl.signal.aborted) return;
        setSummary(null);
        setError(
          navigator.onLine
            ? "Couldn't load insights. Please try again."
            : "Insights need a connection. Your expenses are safe on this device."
        );
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [range, tz, retry]);

  const total = summary?.expenseCents ?? 0;
  const prev = summary?.previous?.expenseCents ?? 0;
  const change = prev > 0 ? ((total - prev) / prev) * 100 : null;
  const dailyAvg = summary?.avgDailyExpenseCents ?? 0;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div
          className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4"
          role="group"
          aria-label="Date range"
        >
          {PRESETS.map((p) => (
            <Chip key={p.key} active={preset === p.key} onClick={() => setPreset(p.key)}>
              {p.label}
            </Chip>
          ))}
        </div>

        {preset === "custom" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="range-from" className="block text-sm font-semibold">
                From
              </label>
              <input
                id="range-from"
                type="date"
                value={customStart}
                max={customEnd}
                onChange={(e) => e.target.value && setCustomStart(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="range-to" className="block text-sm font-semibold">
                To
              </label>
              <input
                id="range-to"
                type="date"
                value={customEnd}
                min={customStart}
                max={toDateInputValue(new Date())}
                onChange={(e) => e.target.value && setCustomEnd(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <WifiOff className="h-6 w-6" aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => setRetry((n) => n + 1)}>
            Try again
          </Button>
        </div>
      ) : !range ? (
        <p className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          Pick a start date that is on or before the end date.
        </p>
      ) : loading && !summary ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        summary && (
          <div
            className={loading ? "space-y-4 opacity-60 transition-opacity" : "space-y-4"}
            aria-busy={loading}
          >
            <section className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-semibold text-muted-foreground">Total spent</p>
              <p className="mt-0.5 text-4xl font-bold tabular-nums tracking-tight">
                {formatMoney(total)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {format(parseISO(range.startISO), "MMM d")} –{" "}
                {format(parseISO(range.endISO), "MMM d, yyyy")}
              </p>
              <div className="mt-3 border-t border-border pt-3 text-sm">
                {change === null ? (
                  <span className="text-muted-foreground">
                    No earlier period to compare with.
                  </span>
                ) : (
                  <span
                    className={
                      change > 0
                        ? "inline-flex items-center gap-1 font-semibold text-warning"
                        : "inline-flex items-center gap-1 font-semibold text-success"
                    }
                  >
                    {change > 0 ? (
                      <ArrowUpRight className="h-4 w-4" aria-hidden />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" aria-hidden />
                    )}
                    {change > 0 ? "Up" : change < 0 ? "Down" : "Same as"}{" "}
                    {change === 0 ? "" : `${Math.abs(change).toFixed(0)}% `}
                    vs the previous {summary.days} days
                  </span>
                )}
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3">
              <Stat label="Daily average" value={formatMoney(dailyAvg)} />
              <Stat label="Expenses" value={String(summary.expenseCount)} />
              <Stat label="Projected / 30 days" value={formatMoney(dailyAvg * 30)} />
              <Stat
                label="Largest"
                value={summary.topExpense ? formatMoney(summary.topExpense.amountCents) : "–"}
                sub={summary.topExpense?.note || undefined}
              />
            </div>

            <AnalyticsCharts startISO={range.startISO} endISO={range.endISO} tz={tz} />
          </div>
        )
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-xl font-bold tabular-nums">{value}</p>
      {sub && <p className="truncate text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}
