"use client";

import { useEffect, useState } from "react";
import { flushQueue } from "@/lib/sync";

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
    });
  }, [online]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-800 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">Sync</span>
        <span
          className={`flex items-center gap-1 ${
            !hydrated
              ? "text-slate-500"
              : online
              ? "text-emerald-600"
              : "text-amber-600"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              !hydrated
                ? "bg-slate-400"
                : online
                ? "bg-emerald-500"
                : "bg-amber-500"
            }`}
          />
          {!hydrated ? "Checking..." : online ? "Online" : "Offline"}
        </span>
      </div>
      {message && <p className="mt-1 text-xs text-slate-600">{message}</p>}
      {!online && (
        <p className="mt-1 text-xs text-amber-700">
          Offline — entries will sync when back online.
        </p>
      )}
    </div>
  );
}
