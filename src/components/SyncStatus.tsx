"use client";

import { useEffect, useState } from "react";
import { flushQueue } from "@/lib/sync";
import { Wifi, WifiOff, CloudCog } from "lucide-react";

export function SyncStatus() {
  const [online, setOnline] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    flushQueue().then((res) => {
      if (res.flushed) setMessage(`Synced ${res.flushed} pending item(s)`);
      setTimeout(() => setMessage(null), 3000);
    });
  }, [online]);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/50 bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Connection Status</h3>
        <div
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            !hydrated
              ? "bg-muted text-muted-foreground"
              : online
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-amber-500/10 text-amber-500"
          }`}
        >
          {!hydrated ? (
            <CloudCog className="h-3.5 w-3.5 animate-pulse" />
          ) : online ? (
            <Wifi className="h-3.5 w-3.5" />
          ) : (
            <WifiOff className="h-3.5 w-3.5" />
          )}
          <span>{!hydrated ? "Checking..." : online ? "Online" : "Offline"}</span>
        </div>
      </div>
      
      {message && (
        <div className="rounded-md bg-primary/10 px-3 py-2 text-xs text-primary animate-in fade-in slide-in-from-top-1">
          {message}
        </div>
      )}
      
      {!online && (
        <p className="text-xs text-muted-foreground">
          Changes will be saved locally and synced when connection is restored.
        </p>
      )}
    </div>
  );
}
