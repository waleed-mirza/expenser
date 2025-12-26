"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { enqueueTransaction, flushQueue } from "@/lib/sync";
import { v4 as uuid } from "uuid";
import { Loader2 } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

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

    await enqueueTransaction(effectiveUserId, payload);
    if (isOnline) {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      }).catch(() => null);
      await flushQueue();
    }

    setAmount("");
    setNote("");
    setLoading(false);
    onSaved?.();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
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
            className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Note
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="e.g. Lunch, Coffee..."
        />
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className={twMerge(
          clsx(
            "flex w-full items-center justify-center rounded-md border border-primary bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
            loading && "cursor-wait opacity-80"
          )
        )}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : online ? (
          "Save Transaction"
        ) : (
          "Save Offline"
        )}
      </button>
    </form>
  );
}
