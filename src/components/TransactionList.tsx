"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  endOfDay,
  format,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { ChevronRight, CloudOff, Loader2, Receipt } from "lucide-react";
import {
  cacheServerTransactions,
  getQueuedOps,
  getTransactionsLocal,
} from "@/lib/idb";
import { dayLabel, formatMoney } from "@/lib/format";
import { groupByDay, overlayPending, type TxItem } from "@/lib/transactions";
import { useDataVersions } from "@/hooks/useDataVersions";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { Chip } from "@/components/ui/chip";
import { Notice, inputClass } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonClass } from "@/components/ui/button";
import { TransactionSheet } from "@/components/TransactionSheet";

const PAGE_SIZE = 20;
const COMPACT_SIZE = 8;

type RangeKey = "all" | "today" | "7d" | "30d" | "custom";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "custom", label: "Custom" },
];

type Bounds = { start: Date | null; end: Date | null };

function getBounds(range: RangeKey, customStart: string, customEnd: string): Bounds {
  const now = new Date();
  switch (range) {
    case "today":
      return { start: startOfDay(now), end: null };
    case "7d":
      return { start: startOfDay(subDays(now, 6)), end: null };
    case "30d":
      return { start: startOfDay(subDays(now, 29)), end: null };
    case "custom":
      return {
        start: customStart ? startOfDay(parseISO(customStart)) : null,
        end: customEnd ? endOfDay(parseISO(customEnd)) : null,
      };
    default:
      return { start: null, end: null };
  }
}

function makeInRange({ start, end }: Bounds) {
  return (iso: string) => {
    const t = new Date(iso).getTime();
    return (!start || t >= start.getTime()) && (!end || t <= end.getTime());
  };
}

function boundsToParams(params: URLSearchParams, { start, end }: Bounds) {
  if (start) params.set("start", start.toISOString());
  if (end) params.set("end", end.toISOString());
}

type ServerTx = TxItem & { clientUpdatedAt?: string };

function toTx(t: ServerTx): TxItem {
  return {
    clientId: t.clientId,
    amountCents: t.amountCents,
    note: t.note ?? null,
    occurredAt: t.occurredAt,
    currencyCode: t.currencyCode,
  };
}

/**
 * Expense feed, grouped by day. `compact` is the dashboard variant (latest few,
 * no filters/paging). Always paints from the device first, then reconciles with
 * the server, and merges not-yet-synced local changes on top.
 */
export function TransactionList({
  userId,
  compact = false,
}: {
  userId?: string;
  compact?: boolean;
}) {
  const [items, setItems] = useState<TxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<"offline" | "error" | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  const [range, setRange] = useState<RangeKey>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selected, setSelected] = useState<TxItem | null>(null);

  const serverCount = useRef(0);
  const loadedKey = useRef("");
  const activeKey = useRef("");
  const loadingMoreRef = useRef(false);

  const { queued, synced } = useDataVersions();
  const { observerRef, isIntersecting } = useInfiniteScroll({
    threshold: 0.1,
    rootMargin: "200px",
  });

  // Full (re)load: on mount, filter change, and after each completed sync.
  useEffect(() => {
    if (!userId) return;
    const ctrl = new AbortController();
    const key = `${range}|${customStart}|${customEnd}`;
    const bounds = getBounds(range, customStart, customEnd);
    const inRange = makeInRange(bounds);
    const take = compact ? COMPACT_SIZE : PAGE_SIZE;
    activeKey.current = key;

    (async () => {
      const ops = await getQueuedOps(200).catch(() => []);

      // Instant paint from the device while the network catches up.
      if (loadedKey.current !== key) {
        const cached = await getTransactionsLocal(userId, 200).catch(() => []);
        if (ctrl.signal.aborted) return;
        const local = cached
          .filter((t) => inRange(t.occurredAt as string))
          .slice(0, take)
          .map((t) => toTx(t as unknown as ServerTx));
        setItems(overlayPending(local, ops, { includeNew: true, inRange }));
        if (local.length) setLoading(false);
      }

      try {
        const params = new URLSearchParams({ take: String(take), skip: "0" });
        boundsToParams(params, bounds);
        const res = await fetch(`/api/transactions?${params}`, {
          credentials: "include",
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("network");
        const data: { items: ServerTx[]; total: number } = await res.json();
        const freshOps = await getQueuedOps(200).catch(() => []);
        if (ctrl.signal.aborted) return;

        const serverItems = data.items.map(toTx);
        serverCount.current = serverItems.length;
        setItems(overlayPending(serverItems, freshOps, { includeNew: true, inRange }));
        setTotal(data.total);
        setHasMore(!compact && serverItems.length < data.total);
        setMoreFailed(false);
        setNotice(null);
        void cacheServerTransactions(userId, data.items).catch(() => null);
      } catch {
        if (ctrl.signal.aborted) return;
        setNotice(navigator.onLine ? "error" : "offline");
        setHasMore(false);
      } finally {
        if (!ctrl.signal.aborted) {
          loadedKey.current = key;
          setLoading(false);
        }
      }
    })();

    return () => ctrl.abort();
  }, [userId, range, customStart, customEnd, synced, compact]);

  // Something was saved/edited/deleted on this device: show it right away.
  useEffect(() => {
    if (!userId || queued === 0) return;
    let cancelled = false;
    (async () => {
      const ops = await getQueuedOps(200).catch(() => []);
      if (cancelled) return;
      const inRange = makeInRange(getBounds(range, customStart, customEnd));
      setItems((prev) => overlayPending(prev, ops, { includeNew: true, inRange }));
    })();
    return () => {
      cancelled = true;
    };
  }, [queued, userId, range, customStart, customEnd]);

  // Infinite scroll.
  useEffect(() => {
    if (
      !userId ||
      compact ||
      !isIntersecting ||
      !hasMore ||
      loading ||
      loadingMore ||
      moreFailed ||
      loadingMoreRef.current
    ) {
      return;
    }
    const keyAtStart = activeKey.current;
    const bounds = getBounds(range, customStart, customEnd);

    (async () => {
      loadingMoreRef.current = true;
      setLoadingMore(true);
      try {
        const params = new URLSearchParams({
          take: String(PAGE_SIZE),
          skip: String(serverCount.current),
        });
        boundsToParams(params, bounds);
        const res = await fetch(`/api/transactions?${params}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("network");
        const data: { items: ServerTx[]; total: number } = await res.json();
        if (activeKey.current !== keyAtStart) return; // filter changed meanwhile

        const ops = await getQueuedOps(200).catch(() => []);
        const more = overlayPending(data.items.map(toTx), ops, { includeNew: false });
        serverCount.current += data.items.length;
        setItems((prev) => {
          const seen = new Set(prev.map((i) => i.clientId));
          return [...prev, ...more.filter((i) => !seen.has(i.clientId))];
        });
        setTotal(data.total);
        setHasMore(serverCount.current < data.total);
      } catch {
        setMoreFailed(true);
      } finally {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    })();
  }, [
    isIntersecting,
    hasMore,
    loading,
    loadingMore,
    moreFailed,
    items.length,
    userId,
    compact,
    range,
    customStart,
    customEnd,
  ]);

  const groups = useMemo(() => groupByDay(items), [items]);
  const filtered = range !== "all";

  const updateItem = (updated: TxItem) =>
    setItems((prev) => prev.map((i) => (i.clientId === updated.clientId ? updated : i)));
  const removeItem = (clientId: string) =>
    setItems((prev) => prev.filter((i) => i.clientId !== clientId));

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="space-y-3">
          <div
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4"
            role="group"
            aria-label="Filter by date"
          >
            {RANGES.map((r) => (
              <Chip key={r.key} active={range === r.key} onClick={() => setRange(r.key)}>
                {r.label}
              </Chip>
            ))}
          </div>

          {range === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="filter-from" className="block text-sm font-semibold">
                  From
                </label>
                <input
                  id="filter-from"
                  type="date"
                  value={customStart}
                  max={customEnd || undefined}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="filter-to" className="block text-sm font-semibold">
                  To
                </label>
                <input
                  id="filter-to"
                  type="date"
                  value={customEnd}
                  min={customStart || undefined}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* The server count excludes unsynced local items, so hide it while any exist. */}
          {total !== null && !loading && !items.some((i) => i.pending) && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {total} expense{total === 1 ? "" : "s"}
              {filtered && " in this range"}
            </p>
          )}
        </div>
      )}

      {notice && (
        <Notice tone="warning">
          {notice === "offline"
            ? "You're offline. Showing what's saved on this device."
            : "Couldn't reach the server. Showing what's saved on this device."}
        </Notice>
      )}

      {loading && items.length === 0 ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading expenses">
          {Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState filtered={filtered} compact={compact} />
      ) : (
        groups.map((group, index) => {
          // The last day may continue on the next page, so its total isn't final yet.
          const totalIsFinal = !(hasMore && index === groups.length - 1);
          return (
            <section key={group.key} aria-label={dayLabel(group.date)}>
              <div className="mb-1.5 flex items-baseline justify-between px-1">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {dayLabel(group.date)}
                </h3>
                {totalIsFinal && (
                  <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                    {formatMoney(group.totalCents)}
                  </span>
                )}
              </div>
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {group.items.map((tx) => (
                  <li key={tx.clientId}>
                    <button
                      type="button"
                      onClick={() => setSelected(tx)}
                      aria-label={`Edit ${tx.note || "expense"}, ${formatMoney(
                        tx.amountCents,
                        tx.currencyCode
                      )}, ${format(new Date(tx.occurredAt), "h:mm a")}`}
                      className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted active:bg-muted"
                    >
                      <span className="min-w-0 flex-1">
                        <span
                          className={
                            tx.note
                              ? "block truncate text-base font-medium"
                              : "block truncate text-base text-muted-foreground"
                          }
                        >
                          {tx.note || "Expense"}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                          {format(new Date(tx.occurredAt), "h:mm a")}
                          {tx.pending && (
                            <span className="inline-flex items-center gap-1 font-medium text-warning">
                              <CloudOff className="h-3.5 w-3.5" aria-hidden />
                              Not synced
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="shrink-0 text-lg font-semibold tabular-nums">
                        {formatMoney(tx.amountCents, tx.currencyCode)}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}

      {!compact && items.length > 0 && hasMore && (
        <div ref={observerRef} className="flex min-h-14 items-center justify-center py-2">
          {moreFailed ? (
            <button
              type="button"
              onClick={() => setMoreFailed(false)}
              className={buttonClass("secondary", "sm")}
            >
              Couldn&apos;t load more · Retry
            </button>
          ) : (
            loadingMore && (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Loading more…
              </span>
            )
          )}
        </div>
      )}

      {!compact && items.length > 0 && !hasMore && !loading && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          That&apos;s everything.
        </p>
      )}

      {selected && userId && (
        <TransactionSheet
          key={selected.clientId}
          tx={selected}
          userId={userId}
          onClose={() => setSelected(null)}
          onSaved={updateItem}
          onDeleted={removeItem}
        />
      )}
    </div>
  );
}

function EmptyState({ filtered, compact }: { filtered: boolean; compact: boolean }) {
  if (compact) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No expenses yet. Add your first one above.
      </p>
    );
  }
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Receipt className="h-6 w-6" aria-hidden />
      </span>
      <p className="text-base font-semibold">
        {filtered ? "No expenses in this range" : "No expenses yet"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {filtered
          ? "Try a different date range."
          : "Add your first expense and it will show up here."}
      </p>
      {!filtered && (
        <Link href="/dashboard" className={`${buttonClass("primary", "md")} mt-5`}>
          Add an expense
        </Link>
      )}
    </div>
  );
}
