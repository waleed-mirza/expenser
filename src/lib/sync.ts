import {
  getQueuedOps,
  removeQueuedOps,
  queueOperation,
  type QueuePayload,
  saveTransactionLocal,
  markTransactionDeleted,
  markTransactionsSynced,
} from "@/lib/idb";
import { v4 as uuid } from "uuid";

export type SyncPayload = {
  clientId: string;
  entity: "transaction" | "category";
  op: "upsert" | "delete";
  payload: QueuePayload;
  clientUpdatedAt: string;
};

/** Fired when something is added to the local queue (saved/edited/deleted). */
export const QUEUE_CHANGED_EVENT = "expenser:queue-changed";
/** Fired after a flush succeeded: the server now has the queued changes. */
export const SYNCED_EVENT = "expenser:synced";

function emit(name: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(name));
}

/** Best-effort: ask the service worker to flush later if the page is closed. */
function registerBackgroundSync() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  // `ready` never resolves when no worker is registered (e.g. in dev), so this
  // must never be awaited by callers.
  navigator.serviceWorker.ready
    .then((registration) => {
      if ("sync" in registration) {
        // @ts-expect-error - Background Sync API
        return registration.sync.register("sync-transactions");
      }
    })
    .catch((err) => console.warn("Background sync registration failed:", err));
}

export async function enqueueTransaction(
  userId: string,
  payload: QueuePayload & { clientId?: string; clientUpdatedAt?: string }
) {
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

  emit(QUEUE_CHANGED_EVENT);
  registerBackgroundSync();

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

  emit(QUEUE_CHANGED_EVENT);
  registerBackgroundSync();

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
    // Remove only what was sent, so ops queued meanwhile (or beyond the batch limit) survive
    await removeQueuedOps(ops.map((op) => op.id));
    await markTransactionsSynced(ops.map((op) => op.clientId)).catch(() => null);
    emit(SYNCED_EVENT);
    return { flushed: ops.length, data };
  } catch (err) {
    console.error("Sync error:", err);
    const error = err instanceof Error ? err.message : String(err);
    return { flushed: 0, error, failed: true };
  }
}
