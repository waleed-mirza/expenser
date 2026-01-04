import {
  getQueuedOps,
  clearQueue,
  queueOperation,
  saveTransactionLocal,
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


export async function flushQueue() {
  if (typeof window === "undefined") return { flushed: 0 };
  if (!navigator.onLine) return { flushed: 0 };
  const ops = await getQueuedOps(200);
  if (!ops.length) return { flushed: 0 };

  try {
    const res = await fetch("/api/sync/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ items: ops }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Sync failed:", errorText);
      return { flushed: 0, error: errorText, failed: true };
    }

    const data = await res.json();
    // Only clear queue on successful sync
    await clearQueue();
    return { flushed: ops.length, data };
  } catch (err: any) {
    console.error("Sync error:", err);
    return { flushed: 0, error: err.message, failed: true };
  }
}
