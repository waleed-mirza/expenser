"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { v4 as uuid } from "uuid";
import { getTransactionsLocal } from "@/lib/idb";
import { enqueueTransaction, enqueueTransactionDelete } from "@/lib/sync";
import { DEFAULT_CURRENCY, formatMoney } from "@/lib/format";
import { useDataVersions } from "@/hooks/useDataVersions";
import { cn } from "@/lib/utils";

interface Favourite {
  note: string;
  amountCents: number;
  currencyCode: string;
}

/** Most frequent (note, amount) pairs, ties broken by recency. */
function pickFavourites(
  rows: Awaited<ReturnType<typeof getTransactionsLocal>>
): Favourite[] {
  const stats = new Map<string, Favourite & { count: number; last: number }>();
  for (const row of rows) {
    const note = typeof row.note === "string" ? row.note.trim() : "";
    if (!note || typeof row.amountCents !== "number") continue;
    const key = `${note.toLowerCase()}|${row.amountCents}`;
    const last = new Date(row.occurredAt as string).getTime();
    const entry = stats.get(key);
    if (entry) {
      entry.count += 1;
      entry.last = Math.max(entry.last, last);
    } else {
      stats.set(key, {
        note,
        amountCents: row.amountCents,
        currencyCode: row.currencyCode ?? DEFAULT_CURRENCY,
        count: 1,
        last,
      });
    }
  }
  return [...stats.values()]
    .sort((a, b) => b.count - a.count || b.last - a.last)
    .slice(0, 6);
}

/**
 * One-tap re-add of your usual expenses ("Chai · PKR 150"). No typing: tap,
 * saved, with a few seconds to undo. Built from what's cached on the device.
 */
export function QuickRepeat({ userId }: { userId?: string }) {
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [undo, setUndo] = useState<{ clientId: string; label: string } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { synced } = useDataVersions();

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getTransactionsLocal(userId, 300)
      .then((rows) => {
        if (!cancelled) setFavourites(pickFavourites(rows));
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [userId, synced]);

  useEffect(() => () => clearTimeout(undoTimer.current), []);

  if (!userId || favourites.length === 0) return null;

  const repeat = async (fav: Favourite) => {
    const now = new Date().toISOString();
    const clientId = uuid();
    try {
      await enqueueTransaction(userId, {
        clientId,
        amountCents: fav.amountCents,
        currencyCode: fav.currencyCode,
        note: fav.note,
        occurredAt: now,
        clientUpdatedAt: now,
        source: navigator.onLine ? "online" : "offline",
      });
    } catch (err) {
      console.error("Quick repeat failed:", err);
      return;
    }
    navigator.vibrate?.(12);
    setUndo({ clientId, label: `${fav.note} · ${formatMoney(fav.amountCents, fav.currencyCode)}` });
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 5000);
  };

  const undoLast = async () => {
    if (!undo) return;
    const { clientId } = undo;
    setUndo(null);
    clearTimeout(undoTimer.current);
    await enqueueTransactionDelete(userId, clientId).catch(() => null);
  };

  return (
    <section aria-label="Repeat a recent expense">
      <h2 className="mb-1.5 flex items-center gap-1.5 px-1 text-sm font-semibold text-muted-foreground">
        <RotateCcw className="h-4 w-4" aria-hidden />
        Tap to repeat
      </h2>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {favourites.map((fav) => (
          <button
            key={`${fav.note}|${fav.amountCents}`}
            type="button"
            onClick={() => void repeat(fav)}
            className="flex h-14 shrink-0 flex-col items-start justify-center rounded-xl border border-border bg-card px-4 text-left transition-colors hover:bg-muted active:scale-[0.97] active:bg-muted"
          >
            <span className="max-w-40 truncate text-sm font-semibold">{fav.note}</span>
            <span className="text-sm tabular-nums text-muted-foreground">
              {formatMoney(fav.amountCents, fav.currencyCode)}
            </span>
          </button>
        ))}
      </div>

      {/* Undo bar floats above the tab bar so it's reachable with a thumb. */}
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-xl px-4 transition-all duration-200",
          undo ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        )}
      >
        {undo && (
          <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-xl bg-foreground px-4 py-3 text-background shadow-lg">
            <span className="min-w-0 truncate text-sm font-medium">Saved {undo.label}</span>
            <button
              type="button"
              onClick={() => void undoLast()}
              className="-my-1 shrink-0 rounded-lg px-3 py-2 text-sm font-bold underline underline-offset-2"
            >
              Undo
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
