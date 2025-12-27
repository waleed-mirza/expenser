"use client";

import { useEffect, useState } from "react";
import { getTransactionsLocal } from "@/lib/idb";
import {
  enqueueTransaction,
  enqueueTransactionDelete,
  flushQueue,
} from "@/lib/sync";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Trash2, Save, X, Cloud, CloudOff, Calendar, Filter } from "lucide-react";

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
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ take: "50" });
        if (startDate) params.append("start", new Date(startDate).toISOString());
        if (endDate) params.append("end", new Date(endDate + "T23:59:59").toISOString());
        
        const res = await fetch(`/api/transactions?${params.toString()}`, {
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
  }, [userId, refreshToken, startDate, endDate]);


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

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return null;
    try {
      const start = startDate ? format(parseISO(startDate), "MMM d, yyyy") : "Beginning";
      const end = endDate ? format(parseISO(endDate), "MMM d, yyyy") : "Today";
      return `${start} - ${end}`;
    } catch {
      return null;
    }
  };

  const dateRangeText = formatDateRange();

  return (
    <div className="space-y-6">
      {/* Date Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Filter by Date</h3>
          </div>
          {dateRangeText && (
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              {dateRangeText}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-background/60 px-3 pl-9 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              End Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-background/60 px-3 pl-9 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
          {(startDate || endDate) && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </motion.button>
          )}
        </div>
      </motion.div>

      {error && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-600 dark:text-amber-500">
          {error}
        </div>
      )}

      {dateRangeText && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{items.length}</span> transaction{items.length !== 1 ? 's' : ''} 
            {dateRangeText && ` for ${dateRangeText}`}
          </p>
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
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: -20 }}
              transition={{ 
                duration: 0.3,
                layout: { type: "spring", stiffness: 500, damping: 30 }
              }}
              whileHover={{ y: -2, scale: 1.01 }}
              key={tx.clientId}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-border/50 bg-card/60 backdrop-blur-xl p-5 shadow-lg transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 sm:flex-row sm:items-center"
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
                    <div className="flex flex-col gap-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-semibold text-foreground">
                          PKR {(tx.amountCents / 100).toFixed(2)}
                        </span>
                        {tx.note && (
                          <span className="text-sm text-muted-foreground line-clamp-1">
                            {tx.note}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(tx.occurredAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
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
                      <motion.button
                        onClick={saveEdit}
                        disabled={saving}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {saving ? "Saving..." : "Save"}
                      </motion.button>
                      <motion.button
                        onClick={cancelEdit}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <motion.button
                        onClick={() => startEdit(tx)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        onClick={() => deleteTx(tx)}
                        disabled={deletingId === tx.clientId}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </motion.li>
          ))}
          </AnimatePresence>
        )}
        
        {items.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-base font-medium text-foreground mb-1">No transactions found</p>
            <p className="text-sm text-muted-foreground">
              {startDate || endDate ? "Try adjusting your date filters" : "Add one to get started"}
            </p>
          </div>
        )}
      </ul>
    </div>
  );
}
