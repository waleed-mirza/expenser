"use client";

import { useEffect, useState } from "react";
import { flushQueue } from "@/lib/sync";
import { Wifi, WifiOff, CloudCog } from "lucide-react";

export function SyncStatus() {
  const [online, setOnline] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setOnline(navigator.onLine);
    setOnline(navigator.onLine);
    setHydrated(true);
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);
    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }, []);

  useEffect(() => {
    if (!online) return;
    let timeoutId: NodeJS.Timeout | null = null;
    let mounted = true;

    flushQueue().then((res) => {
      if (!mounted) return; // Prevent state updates on unmounted component

      if (res.failed) {
        setSyncError(res.error || "Sync failed. Will retry when you're online.");
        timeoutId = setTimeout(() => {
          if (mounted) setSyncError(null);
        }, 5000);
      } else if (res.flushed) {
        setMessage(`Synced ${res.flushed} pending item(s)`);
        setSyncError(null);
        timeoutId = setTimeout(() => {
          if (mounted) setMessage(null);
        }, 3000);
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
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
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <span>{!hydrated ? "Checking..." : online ? "Online" : "Offline"}</span>
        </div>
      </div>
      
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
