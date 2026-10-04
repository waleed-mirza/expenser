import { openDB, type DBSchema } from "idb";

export type QueueStatus = "queued" | "syncing" | "synced" | "error";

export interface LocalTransaction {
  clientId: string;
  userId?: string;
  amountCents?: number;
  currencyCode?: string;
  note?: string | null;
  occurredAt?: string;
  clientUpdatedAt?: string;
  isDeleted?: boolean;
  status?: string;
  [key: string]: unknown;
}

export type QueuePayload = Record<string, unknown>;

export interface QueuedOp {
  clientId: string;
  entity: "transaction" | "category";
  op: "upsert" | "delete";
  payload: QueuePayload;
  userId: string;
  clientUpdatedAt: string;
  status: QueueStatus;
}

interface ExpenserDB extends DBSchema {
  transactions: {
    key: string; // clientId
    value: LocalTransaction;
    indexes: { userId: string; occurredAt: string; clientUpdatedAt: string };
  };
  categories: {
    key: string;
    value: Record<string, unknown>;
    indexes: { userId: string; clientUpdatedAt: string };
  };
  queue: {
    key: number;
    value: QueuedOp;
  };
  meta: {
    key: string;
    value: unknown;
  };
}

async function getDb() {
  return openDB<ExpenserDB>("expenser-offline", 1, {
    upgrade(db) {
      const tx = db.createObjectStore("transactions", { keyPath: "clientId" });
      tx.createIndex("userId", "userId");
      tx.createIndex("occurredAt", "occurredAt");
      tx.createIndex("clientUpdatedAt", "clientUpdatedAt");

      const cats = db.createObjectStore("categories", { keyPath: "clientId" });
      cats.createIndex("userId", "userId");
      cats.createIndex("clientUpdatedAt", "clientUpdatedAt");

      db.createObjectStore("queue", { autoIncrement: true });
      db.createObjectStore("meta");
    },
  });
}

export async function saveTransactionLocal(value: LocalTransaction) {
  const db = await getDb();
  await db.put("transactions", value);
}


/** The user's non-deleted local transactions, newest (by occurredAt) first. */
export async function getTransactionsLocal(userId: string, limit = 50) {
  const db = await getDb();
  const all = await db.getAllFromIndex("transactions", "userId", userId);
  return all
    .filter((t) => !t.isDeleted && typeof t.occurredAt === "string")
    .sort((a, b) => (b.occurredAt ?? "").localeCompare(a.occurredAt ?? ""))
    .slice(0, limit);
}

/**
 * Remember server transactions for offline reads. Records with a pending local
 * change are left alone so unsynced edits are never overwritten.
 */
export async function cacheServerTransactions(
  userId: string,
  items: {
    clientId: string;
    amountCents: number;
    currencyCode?: string;
    note?: string | null;
    occurredAt: string;
    clientUpdatedAt?: string;
  }[]
) {
  if (!items.length) return;
  const db = await getDb();
  const tx = db.transaction("transactions", "readwrite");
  await Promise.all([
    ...items.map(async (item) => {
      const existing = await tx.store.get(item.clientId);
      if (existing?.status === "queued") return;
      await tx.store.put({
        clientId: item.clientId,
        userId,
        amountCents: item.amountCents,
        currencyCode: item.currencyCode,
        note: item.note ?? null,
        occurredAt: item.occurredAt,
        clientUpdatedAt: item.clientUpdatedAt,
        status: "synced",
        isDeleted: false,
      });
    }),
    tx.done,
  ]);
}

/** Flip local records from "queued" to "synced" once the server accepted them. */
export async function markTransactionsSynced(clientIds: string[]) {
  if (!clientIds.length) return;
  const db = await getDb();
  const tx = db.transaction("transactions", "readwrite");
  await Promise.all([
    ...clientIds.map(async (clientId) => {
      const existing = await tx.store.get(clientId);
      if (existing) await tx.store.put({ ...existing, status: "synced" });
    }),
    tx.done,
  ]);
}

export async function queueOperation(op: {
  clientId: string;
  entity: "transaction" | "category";
  op: "upsert" | "delete";
  payload: QueuePayload;
  userId: string;
  clientUpdatedAt: string;
}) {
  const db = await getDb();
  await db.add("queue", { ...op, status: "queued" });
}

export async function markTransactionDeleted(
  userId: string,
  clientId: string,
  clientUpdatedAt: string
) {
  const db = await getDb();
  const existing = await db.get("transactions", clientId);
  await db.put("transactions", {
    ...(existing ?? {}),
    userId,
    clientId,
    isDeleted: true,
    clientUpdatedAt,
    status: "queued",
  });
}

export async function getQueuedOps(limit = 100) {
  const db = await getDb();
  const tx = db.transaction("queue", "readonly");
  const store = tx.objectStore("queue");

  const results: (QueuedOp & { id: number })[] = [];
  let cursor = await store.openCursor();

  while (cursor && results.length < limit) {
    results.push({ id: cursor.key, ...cursor.value });
    cursor = await cursor.continue();
  }

  return results;
}

export async function clearQueue() {
  const db = await getDb();
  await db.clear("queue");
}

/** Remove only the given queue entries (by key), leaving newer ones intact. */
export async function removeQueuedOps(ids: number[]) {
  if (!ids.length) return;
  const db = await getDb();
  const tx = db.transaction("queue", "readwrite");
  await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
}

/**
 * Wipe everything this device stores locally (cached expenses, the unsynced
 * queue, meta) plus cached summaries/suggestions. Never touches the server.
 * Keeps `lastUserId` (offline saves need it) and the theme preference.
 */
export async function clearLocalData() {
  const db = await getDb();
  const stores = ["transactions", "categories", "queue", "meta"] as const;
  const tx = db.transaction([...stores], "readwrite");
  await Promise.all([...stores.map((name) => tx.objectStore(name).clear()), tx.done]);

  for (const key of Object.keys(localStorage)) {
    if (key === "expenser:recent-notes" || key.startsWith("expenser:overview:")) {
      localStorage.removeItem(key);
    }
  }
}

export async function setMeta(key: string, value: unknown) {
  const db = await getDb();
  await db.put("meta", value, key);
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const db = await getDb();
  return db.get("meta", key) as Promise<T | undefined>;
}
