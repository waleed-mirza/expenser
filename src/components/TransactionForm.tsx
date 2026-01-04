"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { enqueueTransaction, flushQueue } from "@/lib/sync";
import { v4 as uuid } from "uuid";
import { Loader2 } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";
import { motion } from "framer-motion";

export function TransactionForm({ onSaved }: { onSaved?: () => void }) {
  const { data } = useSession();
  const userId = data?.user?.id;
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [cachedUserId, setCachedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setOnline(navigator.onLine);
    handler();
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);
    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("lastUserId");
    if (stored) setCachedUserId(stored);
  }, []);

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;
    localStorage.setItem("lastUserId", userId);
    setCachedUserId(userId);
  }, [userId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double-submission
    if (loading) return;

    const effectiveUserId = userId ?? cachedUserId;
    if (!effectiveUserId) {
      setError(
        online
          ? "You must be signed in."
          : "Offline save needs a prior sign-in on this device."
      );
      return;
    }
    setError(null);
    setLoading(true);
    const isOnline = online;
    const clientId = uuid();
    const now = new Date();
    const amountNumber = Math.round(Number(amount || "0") * 100);
    const payload = {
      clientId,
      amountCents: amountNumber,
      currencyCode: "PKR",
      note: note || undefined,
      occurredAt: now.toISOString(),
      clientUpdatedAt: now.toISOString(),
      source: isOnline ? "online" : "offline",
    };

    try {
      await enqueueTransaction(effectiveUserId, payload);
      if (isOnline) {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          console.error("Failed to save transaction:", await res.text());
        }

        await flushQueue();
      }

      setAmount("");
      setNote("");
      onSaved?.();
    } catch (err) {
      console.error("Error saving transaction:", err);
      setError("Failed to save transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className="mb-2 block text-sm font-medium text-foreground">
          Amount (PKR)
        </label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            placeholder="0.00"
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border-2 border-border/50 bg-background/60 backdrop-blur-sm px-4 py-3 text-foreground shadow-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
            required
          />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-purple-500/5 pointer-events-none opacity-0 focus-within:opacity-100 transition-opacity" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="mb-2 block text-sm font-medium text-foreground">
          Note
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-xl border-2 border-border/50 bg-background/60 backdrop-blur-sm px-4 py-3 text-foreground shadow-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
          placeholder="e.g. Lunch, Coffee..."
        />
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2"
        >
          {error}
        </motion.p>
      )}

      <motion.button
        type="submit"
        disabled={loading}
        aria-label={online ? "Save transaction" : "Save transaction offline"}
        whileHover={{ scale: loading ? 1 : 1.01 }}
        whileTap={{ scale: loading ? 1 : 0.99 }}
        className={twMerge(
          clsx(
            "flex w-full items-center justify-center rounded-xl border-0 bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            loading && "cursor-wait"
          )
        )}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Saving...
          </>
        ) : online ? (
          "Save Transaction"
        ) : (
          "Save Offline"
        )}
      </motion.button>
    </form>
  );
}
