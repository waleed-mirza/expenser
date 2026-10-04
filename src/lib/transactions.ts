import { format, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import type { QueuedOp } from "@/lib/idb";

export interface TxItem {
  clientId: string;
  amountCents: number;
  note?: string | null;
  occurredAt: string;
  currencyCode?: string;
  /** Changed on this device and not yet confirmed by the server. */
  pending?: boolean;
}

/**
 * Normalises typed input to a plain decimal with at most 2 fraction digits.
 * Returns null for input that should be rejected (letters, 3 decimals, ...).
 */
export function sanitizeAmountInput(value: string): string | null {
  const cleaned = value.replace(/,/g, "");
  return /^\d{0,9}(\.\d{0,2})?$/.test(cleaned) ? cleaned : null;
}

/** "12.50" -> 1250. Null when empty, zero or not a number. */
export function parseAmountToCents(value: string): number | null {
  const n = Number(value);
  if (!value || !Number.isFinite(n)) return null;
  const cents = Math.round(n * 100);
  return cents > 0 ? cents : null;
}

export function centsToInput(cents: number) {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

export function toDateInputValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

/** Local noon of a yyyy-MM-dd date: stable ordering and no day-edge shifts. */
export function dateInputToNoon(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export interface DayGroup {
  key: string;
  date: Date;
  items: TxItem[];
  totalCents: number;
}

/** Groups an already newest-first list by local calendar day. */
export function groupByDay(items: TxItem[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const item of items) {
    const date = new Date(item.occurredAt);
    const key = format(date, "yyyy-MM-dd");
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = { key, date, items: [], totalCents: 0 };
      groups.push(group);
    }
    group.items.push(item);
    group.totalCents += item.amountCents;
  }
  return groups;
}

// A queued create carries `source` ("online"/"offline"); edits never do.
function isCreatePayload(payload: Record<string, unknown>) {
  return typeof payload.source === "string";
}

function hasFullPayload(p: Record<string, unknown>) {
  return typeof p.amountCents === "number" && typeof p.occurredAt === "string";
}

/**
 * Lays not-yet-synced local changes over a server list so saves, edits and
 * deletes show up instantly (and never flicker back while a sync is in flight).
 */
export function overlayPending(
  items: TxItem[],
  ops: QueuedOp[],
  opts: { includeNew: boolean; inRange?: (iso: string) => boolean }
): TxItem[] {
  const relevant = ops.filter((op) => op.entity === "transaction");
  if (!relevant.length) return items;

  const map = new Map(items.map((item) => [item.clientId, item]));
  const touched = new Set<string>();
  let inserted = false;

  for (const op of relevant) {
    if (op.op === "delete") {
      map.delete(op.clientId);
      touched.delete(op.clientId);
      continue;
    }
    const p = op.payload;
    if (!hasFullPayload(p)) continue;
    const existing = map.get(op.clientId);
    if (!existing) {
      const eligible =
        opts.includeNew &&
        isCreatePayload(p) &&
        (!opts.inRange || opts.inRange(p.occurredAt as string));
      if (!eligible) continue;
      inserted = true;
    }
    touched.add(op.clientId);
    map.set(op.clientId, {
      ...existing,
      clientId: op.clientId,
      amountCents: p.amountCents as number,
      note: typeof p.note === "string" && p.note ? p.note : null,
      occurredAt: p.occurredAt as string,
      currencyCode:
        typeof p.currencyCode === "string" ? p.currencyCode : existing?.currencyCode,
    });
  }

  const result = [...map.values()].map((item) =>
    touched.has(item.clientId) ? { ...item, pending: true } : item
  );
  if (inserted) result.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  return result;
}

export interface PeriodTotals {
  todayCents: number;
  todayCount: number;
  weekCents: number;
  monthCents: number;
}

export const EMPTY_TOTALS: PeriodTotals = {
  todayCents: 0,
  todayCount: 0,
  weekCents: 0,
  monthCents: 0,
};

/**
 * Totals of expenses created on this device that the server has not seen yet.
 * Edits/deletes of already-synced items are ignored (small, self-correcting).
 */
export function pendingCreateTotals(ops: QueuedOp[], now = new Date()): PeriodTotals {
  const byId = new Map<
    string,
    { create: boolean; cents: number; at: string; deleted: boolean }
  >();
  for (const op of ops) {
    if (op.entity !== "transaction") continue;
    const entry = byId.get(op.clientId);
    if (op.op === "delete") {
      if (entry) entry.deleted = true;
      continue;
    }
    if (!hasFullPayload(op.payload)) continue;
    byId.set(op.clientId, {
      create: (entry?.create ?? false) || isCreatePayload(op.payload),
      cents: op.payload.amountCents as number,
      at: op.payload.occurredAt as string,
      deleted: false,
    });
  }

  const day = startOfDay(now).getTime();
  const week = startOfWeek(now, { weekStartsOn: 1 }).getTime();
  const month = startOfMonth(now).getTime();
  const totals = { ...EMPTY_TOTALS };
  for (const entry of byId.values()) {
    if (!entry.create || entry.deleted) continue;
    const t = new Date(entry.at).getTime();
    if (t >= day) {
      totals.todayCents += entry.cents;
      totals.todayCount += 1;
    }
    if (t >= week) totals.weekCents += entry.cents;
    if (t >= month) totals.monthCents += entry.cents;
  }
  return totals;
}
