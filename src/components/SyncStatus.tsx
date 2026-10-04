"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, CloudUpload, RefreshCw, WifiOff } from "lucide-react";
import { flushQueue, QUEUE_CHANGED_EVENT } from "@/lib/sync";
import { getQueuedOps } from "@/lib/idb";
import { useOnline } from "@/hooks/useOnline";
import { cn } from "@/lib/utils";

const MAX_BACKOFF_MS = 60_000;

/**
 * Header pill that shows connection / sync state and is also the app's single
 * sync engine: it flushes the offline queue whenever something is queued, the
 * device comes back online, or after a failure (exponential backoff).
 */
export function SyncStatus() {
  const online = useOnline();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [failed, setFailed] = useState(false);
  const syncRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    let cancelled = false;
    let running = false;
    let failures = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const refreshPending = async () => {
      try {
        const ops = await getQueuedOps(500);
        if (!cancelled) setPending(ops.length);
      } catch {
        // IndexedDB unavailable; leave the count as is.
      }
    };

    const sync = async () => {
      if (running || !navigator.onLine) return;
      running = true;
      clearTimeout(timer);
      try {
        // Drain in a few rounds in case more was queued while flushing.
        for (let round = 0; round < 5; round++) {
          const next = await getQueuedOps(1);
          if (!next.length) {
            failures = 0;
            if (!cancelled) setFailed(false);
            break;
          }
          if (!cancelled) setSyncing(true);
          const res = await flushQueue();
          if (res.failed) {
            failures += 1;
            if (!cancelled) setFailed(true);
            timer = setTimeout(
              sync,
              Math.min(2000 * 2 ** failures, MAX_BACKOFF_MS)
            );
            break;
          }
          failures = 0;
          if (!cancelled) setFailed(false);
        }
      } finally {
        running = false;
        if (!cancelled) setSyncing(false);
        await refreshPending();
      }
    };

    syncRef.current = sync;

    const onQueued = () => {
      void refreshPending();
      void sync();
    };
    const onOnline = () => void sync();

    window.addEventListener(QUEUE_CHANGED_EVENT, onQueued);
    window.addEventListener("online", onOnline);
    void refreshPending();
    void sync();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener(QUEUE_CHANGED_EVENT, onQueued);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  const state = !online
    ? "offline"
    : failed
    ? "failed"
    : syncing
    ? "syncing"
    : pending > 0
    ? "pending"
    : "synced";

  const view = {
    offline: {
      label: pending > 0 ? `Offline · ${pending} saved` : "Offline",
      icon: <WifiOff className="h-4 w-4" aria-hidden />,
      tone: "border-warning/30 bg-warning-soft text-warning",
    },
    failed: {
      label: "Sync failed · Retry",
      icon: <AlertTriangle className="h-4 w-4" aria-hidden />,
      tone: "border-destructive/30 bg-destructive-soft text-destructive",
    },
    syncing: {
      label: "Syncing…",
      icon: <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />,
      tone: "border-primary/30 bg-primary-soft text-primary",
    },
    pending: {
      label: `${pending} to sync`,
      icon: <CloudUpload className="h-4 w-4" aria-hidden />,
      tone: "border-warning/30 bg-warning-soft text-warning",
    },
    synced: {
      label: "Synced",
      icon: <CheckCircle2 className="h-4 w-4" aria-hidden />,
      tone: "border-transparent bg-transparent text-muted-foreground",
    },
  }[state];

  const actionable = state === "failed" || state === "pending";

  return (
    <button
      type="button"
      onClick={() => void syncRef.current()}
      disabled={!actionable}
      aria-live="polite"
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium disabled:pointer-events-none",
        view.tone
      )}
    >
      {view.icon}
      {view.label}
    </button>
  );
}
