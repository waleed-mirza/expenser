"use client";

import { useEffect } from "react";
import { flushQueue } from "@/lib/sync";

const SW_VERSION = process.env.NEXT_PUBLIC_SW_VERSION ?? "v1";

export function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    // The worker asks the app to flush the offline queue on Background Sync.
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_REQUEST") {
        void flushQueue();
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    navigator.serviceWorker
      .register(`/sw.js?v=${encodeURIComponent(SW_VERSION)}`, { scope: "/" })
      .catch((err) => console.error("SW registration failed", err));

    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);
  return null;
}
