"use client";

import { useEffect, useState } from "react";
import { flushQueue } from "@/lib/sync";
import { Wifi, WifiOff, CloudCog } from "lucide-react";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-3 rounded-2xl border-2 border-border/50 bg-card/60 backdrop-blur-xl p-5 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Connection Status</h3>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold shadow-md ${
            !hydrated
              ? "bg-muted text-muted-foreground"
              : online
              ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
              : "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
          }`}
        >
          {!hydrated ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <CloudCog className="h-4 w-4" />
            </motion.div>
          ) : online ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wifi className="h-4 w-4" />
            </motion.div>
          ) : (
            <motion.div
              animate={{ x: [0, 2, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <WifiOff className="h-4 w-4" />
            </motion.div>
          )}
          <span>{!hydrated ? "Checking..." : online ? "Online" : "Offline"}</span>
        </motion.div>
      </div>
      
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 px-4 py-2.5 text-xs font-semibold text-primary backdrop-blur-sm"
        >
          {message}
        </motion.div>
      )}
      
      {!online && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-medium text-muted-foreground bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2"
        >
          Changes will be saved locally and synced when connection is restored.
        </motion.p>
      )}
    </motion.div>
  );
}
