"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { getQueuedOps } from "@/lib/idb";
import { formatMoney } from "@/lib/format";
import {
  EMPTY_TOTALS,
  pendingCreateTotals,
  type PeriodTotals,
} from "@/lib/transactions";
import { useDataVersions } from "@/hooks/useDataVersions";
import { Skeleton } from "@/components/ui/skeleton";

const cacheKey = (userId: string) => `expenser:overview:${userId}`;

/**
 * Today / week / month at a glance. Server totals plus anything created on this
 * device that hasn't synced yet; falls back to the last known totals offline.
 */
export function SpendOverview({ userId }: { userId?: string }) {
  const [server, setServer] = useState<PeriodTotals | null>(null);
  const [pending, setPending] = useState<PeriodTotals>(EMPTY_TOTALS);
  const [stale, setStale] = useState(false);
  const [ready, setReady] = useState(false);
  const { queued, synced } = useDataVersions();

  // Network totals: on mount and after each completed sync.
  useEffect(() => {
    if (!userId) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/analytics/overview", {
          credentials: "include",
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("network");
        const json: PeriodTotals = await res.json();
        localStorage.setItem(cacheKey(userId), JSON.stringify(json));
        setServer(json);
        setStale(false);
      } catch {
        if (ctrl.signal.aborted) return;
        try {
          const cached = localStorage.getItem(cacheKey(userId));
          if (cached) setServer(JSON.parse(cached));
        } catch {
          // no cached totals
        }
        setStale(true);
      } finally {
        if (!ctrl.signal.aborted) setReady(true);
      }
    })();
    return () => ctrl.abort();
  }, [userId, synced]);

  // Local unsynced expenses: re-evaluated whenever the queue changes.
  useEffect(() => {
    let cancelled = false;
    getQueuedOps(500)
      .then((ops) => {
        if (!cancelled) setPending(pendingCreateTotals(ops));
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [queued, synced]);

  const total = (key: keyof PeriodTotals) => (server?.[key] ?? 0) + pending[key];

  return (
    <section
      aria-label="Spending summary"
      className="rounded-2xl border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Spent today</p>
          {ready ? (
            <p className="mt-0.5 text-4xl font-bold tabular-nums tracking-tight">
              {formatMoney(total("todayCents"))}
            </p>
          ) : (
            <Skeleton className="mt-2 h-10 w-44" />
          )}
        </div>
        {ready && (
          <p className="pt-1 text-sm text-muted-foreground">
            {total("todayCount")} expense{total("todayCount") === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
        <div>
          <dt className="text-sm text-muted-foreground">This week</dt>
          <dd className="text-lg font-semibold tabular-nums">
            {ready ? formatMoney(total("weekCents")) : <Skeleton className="mt-1 h-6 w-24" />}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">This month</dt>
          <dd className="text-lg font-semibold tabular-nums">
            {ready ? formatMoney(total("monthCents")) : <Skeleton className="mt-1 h-6 w-24" />}
          </dd>
        </div>
      </dl>

      {ready && stale && (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-warning">
          <WifiOff className="h-4 w-4" aria-hidden />
          {server ? "Offline: totals may be behind." : "Offline: showing this device only."}
        </p>
      )}
    </section>
  );
}
