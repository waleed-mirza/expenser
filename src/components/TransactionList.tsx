"use client";

import { useEffect, useState } from "react";
import { getTransactionsLocal } from "@/lib/idb";
import {
  enqueueTransaction,
  enqueueTransactionDelete,
  flushQueue,
} from "@/lib/sync";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Trash2, Save, X, Cloud, CloudOff } from "lucide-react";

interface TxItem {
  id?: string;
  clientId: string;
  amountCents: number;
  note?: string | null;
  occurredAt: string;
  currencyCode?: string;
  status?: string;
}

export function TransactionList({
  userId,
  refreshToken = 0,
}: {
  userId?: string;
  refreshToken?: number;
}) {
  const [items, setItems] = useState<TxItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editNote, setEditNote] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/transactions?take=50`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data.items ?? []);
        } else {
          throw new Error("network");
        }
      } catch (err) {
        setError("Showing cached data (offline)");
        const cached = await getTransactionsLocal(userId);
        setItems(cached ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, refreshToken]);


  useEffect(() => {
    if (!editingId) return;
    const tx = items.find((it) => it.clientId === editingId);
    if (!tx) return;
    const amt = typeof tx.amountCents === "number" ? tx.amountCents : 0;
    setEditAmount((amt / 100).toFixed(2));
    setEditNote(tx.note ?? "");
  }, [editingId, items]);

  const startEdit = (tx: TxItem) => {
    setEditingId(tx.clientId);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditAmount("");
    setEditNote("");
  };

  const saveEdit = async () => {
    if (!userId || !editingId) return;
    setSaving(true);
    const payload = {
      clientId: editingId,
      amountCents: Math.round(Number(editAmount || "0") * 100),
      note: editNote || undefined,
      clientUpdatedAt: new Date().toISOString(),
    };
    try {
      const res = await fetch(`/api/transactions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("network");
      const data = await res.json();
      setItems((prev) =>
        prev.map((it) =>
          it.clientId === editingId ? { ...it, ...data.item } : it
        )
      );
      cancelEdit();
    } catch {
      // offline fallback: queue update
      await enqueueTransaction(userId, payload);
      await flushQueue();
      setItems((prev) =>
        prev.map((it) =>
          it.clientId === editingId
            ? { ...it, ...payload, occurredAt: it.occurredAt }
            : it
        )
      );
      cancelEdit();
    } finally {
      setSaving(false);
    }
  };

  const deleteTx = async (tx: TxItem) => {
    if (!userId) return;
    setDeletingId(tx.clientId);
    const payload = {
      clientId: tx.clientId,
      clientUpdatedAt: new Date().toISOString(),
    };
    try {
      const res = await fetch(`/api/transactions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("network");
      setItems((prev) => prev.filter((it) => it.clientId !== tx.clientId));
    } catch {
      await enqueueTransactionDelete(
        userId,
        tx.clientId,
        payload.clientUpdatedAt
      );
      await flushQueue();
      setItems((prev) => prev.filter((it) => it.clientId !== tx.clientId));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-500 ring-1 ring-inset ring-amber-500/20">
          {error}
        </div>
      )}
      
      <ul className="space-y-3">
        {loading && items.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex h-20 w-full animate-pulse rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-muted"></div>
                  <div className="h-3 w-32 rounded bg-muted"></div>
                </div>
                <div className="h-8 w-8 rounded bg-muted"></div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
          {items.map((tx) => (
            <motion.li
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={tx.clientId}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/20 hover:shadow-md sm:flex-row sm:items-center"
            >
              <div className="flex flex-1 flex-col gap-1">
                {editingId === tx.clientId ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-32 rounded-md border border-input bg-background/50 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground">Note</label>
                      <input
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Note"
                        className="w-full rounded-md border border-input bg-background/50 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-foreground">
                        <span className="text-xs font-medium text-muted-foreground align-top mr-0.5">PKR</span>
                        {(tx.amountCents / 100).toFixed(2)}
                      </span>
                      {tx.note && (
                        <span className="text-sm text-foreground/80 line-clamp-1">
                          {tx.note}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(tx.occurredAt), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4 sm:border-t-0 sm:pt-0 sm:mt-0 sm:pl-4 sm:flex-col sm:items-end sm:gap-1">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                   {tx.status === "queued" ? (
                    <span className="inline-flex items-center gap-1 text-amber-500">
                      <CloudOff className="h-3 w-3" />
                      Pending
                    </span>
                   ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-500">
                      <Cloud className="h-3 w-3" />
                      Synced
                    </span>
                   )}
                </div>

                <div className="flex gap-2">
                  {editingId === tx.clientId ? (
                    <>
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 active:scale-95 transition-transform disabled:opacity-50"
                      >
                        <Save className="h-3 w-3" />
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/80 active:scale-95 transition-transform"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(tx)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors active:scale-90"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteTx(tx)}
                        disabled={deletingId === tx.clientId}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors active:scale-90 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.li>
          ))}
          </AnimatePresence>
        )}
        
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <p>No transactions yet.</p>
            <p className="text-sm">Add one to get started!</p>
          </div>
        )}
      </ul>
    </div>
  );
}
