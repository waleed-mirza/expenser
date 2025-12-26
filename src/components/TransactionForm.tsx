"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { enqueueTransaction, flushQueue } from "@/lib/sync";
import { v4 as uuid } from "uuid";

export function TransactionForm({ onSaved }: { onSaved?: () => void }) {
  const { data } = useSession();
  const userId = data?.user?.id;
  const [amount, setAmount] = useState("0");
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

    setAmount("0");
    setNote("");
    setLoading(false);
    onSaved?.();
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Add expense</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Amount
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-indigo-400 focus:outline-none"
            required
          />
        </label>
        <div />
      </div>
      <label className="text-sm font-medium text-slate-700">
        Note
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-indigo-400 focus:outline-none"
          placeholder="What did you spend on?"
        />
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-500 py-2 text-white font-semibold transition hover:bg-indigo-400 disabled:opacity-60"
      >
        {loading ? "Saving..." : online ? "Save" : "Save offline"}
      </button>
    </form>
  );
}
