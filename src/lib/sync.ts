import {
  getQueuedOps,
  clearQueue,
  queueOperation,
  saveTransactionLocal,
  saveCategoryLocal,
  markTransactionDeleted,
} from "@/lib/idb";
import { v4 as uuid } from "uuid";

export type SyncPayload = {
  clientId: string;
  entity: "transaction" | "category";
  op: "upsert" | "delete";
  payload: any;
  clientUpdatedAt: string;
};

export async function enqueueTransaction(userId: string, payload: any) {
  const clientId = payload.clientId ?? uuid();
  const clientUpdatedAt = payload.clientUpdatedAt ?? new Date().toISOString();
  const record = {
    ...payload,
    clientId,
    userId,
    clientUpdatedAt,
    status: "queued",
  };
  await saveTransactionLocal(record);
  await queueOperation({
    clientId,
    entity: "transaction",
    op: "upsert",
    payload,
    userId,
    clientUpdatedAt,
  });
  return clientId;
}

export async function enqueueTransactionDelete(
  userId: string,
  clientId: string,
  clientUpdatedAt?: string
) {
  const timestamp = clientUpdatedAt ?? new Date().toISOString();
  await markTransactionDeleted(userId, clientId, timestamp);
  await queueOperation({
    clientId,
    entity: "transaction",
    op: "delete",
    payload: { clientId, clientUpdatedAt: timestamp },
    userId,
    clientUpdatedAt: timestamp,
  });
  return clientId;
}

export async function enqueueCategory(userId: string, payload: any) {
  const clientId = payload.clientId ?? uuid();
  const clientUpdatedAt = payload.clientUpdatedAt ?? new Date().toISOString();
  const record = {
    ...payload,
    clientId,
    userId,
    clientUpdatedAt,
    status: "queued",
  };
  await saveCategoryLocal(record);
  await queueOperation({
    clientId,
    entity: "category",
    op: "upsert",
    payload,
    userId,
    clientUpdatedAt,
  });
  return clientId;
}

export async function flushQueue() {
  if (typeof window === "undefined") return { flushed: 0 };
  if (!navigator.onLine) return { flushed: 0 };
  const ops = await getQueuedOps(200);
  if (!ops.length) return { flushed: 0 };

  const res = await fetch("/api/sync/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ items: ops }),
  });
  if (!res.ok) {
    return { flushed: 0, error: await res.text() };
  }
  const data = await res.json();
  // Simplify: on success, clear queue; server is idempotent by clientId.
  await clearQueue();
  return { flushed: ops.length, data };
}
