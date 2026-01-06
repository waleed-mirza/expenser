"use client";

import { useEffect, useState } from "react";
import { flushQueue } from "@/lib/sync";
import { getQueuedOps } from "@/lib/idb";
import { Wifi, WifiOff, CloudCog, RefreshCw } from "lucide-react";

export function SyncStatus() {
  const [online, setOnline] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Check pending operations count
  const checkPendingOps = async () => {
    try {
      const ops = await getQueuedOps();
      setPendingCount(ops.length);
    } catch (err) {
      console.error("Failed to check pending ops:", err);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setOnline(navigator.onLine);
    setOnline(navigator.onLine);
    setHydrated(true);
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);

    // Initial check for pending operations
    checkPendingOps();

    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }, []);

  // Update pending count when offline
  useEffect(() => {
    if (!online) {
      checkPendingOps();
      // Check periodically while offline to update count
      const interval = setInterval(checkPendingOps, 5000);
      return () => clearInterval(interval);
    }
  }, [online]);

  // Sync with retry mechanism when online
  useEffect(() => {
    if (!online) return;

    let mounted = true;
    let syncInterval: NodeJS.Timeout | null = null;
    let messageTimeout: NodeJS.Timeout | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 5;

    const attemptSync = async () => {
      if (!mounted || !navigator.onLine) return;

      // Check if there are pending operations
      const ops = await getQueuedOps();
      if (ops.length === 0) {
        setPendingCount(0);
        return;
      }

      setSyncing(true);
      const res = await flushQueue();
      setSyncing(false);

      if (!mounted) return;

      if (res.failed) {
        retryCount++;
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 60000); // Exponential backoff, max 60s

        setSyncError(
          `Sync failed. Retrying in ${Math.round(retryDelay / 1000)}s... (${retryCount}/${MAX_RETRIES})`
        );

        if (retryCount < MAX_RETRIES) {
          messageTimeout = setTimeout(() => {
            if (mounted) setSyncError(null);
          }, retryDelay);

          // Schedule retry
          syncInterval = setTimeout(attemptSync, retryDelay);
        } else {
          setSyncError("Sync failed after multiple attempts. Will retry periodically.");
          messageTimeout = setTimeout(() => {
            if (mounted) {
              setSyncError(null);
              retryCount = 0; // Reset retry count
            }
          }, 10000);

          // Continue periodic retry every 60 seconds
          syncInterval = setTimeout(attemptSync, 60000);
        }
      } else if (res.flushed) {
        retryCount = 0; // Reset on success
        setMessage(`Synced ${res.flushed} pending item(s)`);
        setSyncError(null);
        setPendingCount(0);

        messageTimeout = setTimeout(() => {
          if (mounted) setMessage(null);
        }, 3000);

        // Check again after a short delay in case more items were added
        syncInterval = setTimeout(attemptSync, 5000);
      } else {
        // No items to sync
        setPendingCount(0);
      }
    };

    // Start initial sync
    attemptSync();

    return () => {
      mounted = false;
      if (syncInterval) clearTimeout(syncInterval);
      if (messageTimeout) clearTimeout(messageTimeout);
    };
  }, [online]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Connection Status</h3>
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold shadow-md transition-all ${
            !hydrated
              ? "bg-muted text-muted-foreground"
              : online
              ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
              : "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
          }`}
        >
          {!hydrated ? (
            <CloudCog className="h-4 w-4 animate-pulse" />
          ) : online ? (
            syncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Wifi className="h-4 w-4" />
            )
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <span>
            {!hydrated
              ? "Checking..."
              : online
              ? syncing
                ? "Syncing..."
                : "Online"
              : "Offline"}
          </span>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 px-4 py-2.5 text-xs font-semibold text-blue-400 backdrop-blur-sm flex items-center justify-between">
          <span>{pendingCount} transaction{pendingCount > 1 ? 's' : ''} pending sync</span>
          {syncing && <RefreshCw className="h-3 w-3 animate-spin" />}
        </div>
      )}

      {message && (
        <div className="rounded-xl bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 px-4 py-2.5 text-xs font-semibold text-primary backdrop-blur-sm animate-pulse">
          {message}
        </div>
      )}

      {syncError && (
        <div className="rounded-xl bg-gradient-to-r from-destructive/20 to-red-500/20 border border-destructive/30 px-4 py-2.5 text-xs font-semibold text-destructive backdrop-blur-sm">
          {syncError}
        </div>
      )}

      {!online && (
        <p className="text-xs font-medium text-muted-foreground bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          Changes will be saved locally and synced when connection is restored.
        </p>
      )}
    </div>
  );
}
