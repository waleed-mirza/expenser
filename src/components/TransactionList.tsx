"use client";

import { useEffect, useState } from "react";
import { getTransactionsLocal } from "@/lib/idb";
import {
  enqueueTransaction,
  enqueueTransactionDelete,
  flushQueue,
} from "@/lib/sync";
import { format } from "date-fns";

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
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/transactions?take=50`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setItems(data.items ?? []);
          return;
        }
        throw new Error("network");
      } catch (err) {
        setError("Showing cached data (offline)");
        const cached = await getTransactionsLocal(userId);
        setItems(cached ?? []);
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
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Recent</h3>
        {error && <span className="text-xs text-amber-600">{error}</span>}
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((tx) => (
          <li
            key={tx.clientId}
            className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2"
          >
            <div className="flex flex-col flex-1">
              {editingId === tx.clientId ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-32 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900"
                    />
                    <input
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="Note"
                      className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={saving}
                      className="rounded-md bg-indigo-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-sm font-semibold text-slate-900">
                    {(tx.amountCents / 100).toFixed(2)}{" "}
                    {tx.currencyCode ?? "PKR"}
                  </span>
                  {tx.note && (
                    <span className="text-xs text-slate-600">{tx.note}</span>
                  )}
                  <span className="text-xs text-slate-500">
                    {format(new Date(tx.occurredAt), "PPp")}
                  </span>
                </>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 pl-3">
              <span
                className={`text-xs ${
                  tx.status === "queued" ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {tx.status === "queued" ? "Pending" : "Synced"}
              </span>
              <div className="flex gap-2">
                {editingId === tx.clientId ? null : (
                  <button
                    type="button"
                    onClick={() => startEdit(tx)}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteTx(tx)}
                  disabled={deletingId === tx.clientId}
                  className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
                >
                  {deletingId === tx.clientId ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm text-slate-600">No transactions yet.</li>
        )}
      </ul>
    </div>
  );
}
