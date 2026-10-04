"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Trash2, X } from "lucide-react";
import { enqueueTransaction, enqueueTransactionDelete } from "@/lib/sync";
import { DEFAULT_CURRENCY } from "@/lib/format";
import {
  centsToInput,
  parseAmountToCents,
  sanitizeAmountInput,
  toDateInputValue,
  type TxItem,
} from "@/lib/transactions";
import { Button } from "@/components/ui/button";
import { Field, Notice, inputClass } from "@/components/ui/field";

/**
 * Bottom sheet to edit or delete one expense. Changes are written to the
 * device queue (like adding), so the sheet closes instantly even offline.
 */
export function TransactionSheet({
  tx,
  userId,
  onClose,
  onSaved,
  onDeleted,
}: {
  tx: TxItem;
  userId: string;
  onClose: () => void;
  onSaved: (updated: TxItem) => void;
  onDeleted: (clientId: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const original = new Date(tx.occurredAt);
  const [amount, setAmount] = useState(centsToInput(tx.amountCents));
  const [note, setNote] = useState(tx.note ?? "");
  const [date, setDate] = useState(toDateInputValue(original));
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // Delete needs a deliberate second tap; the arming times out.
  useEffect(() => {
    if (!confirmingDelete) return;
    const t = setTimeout(() => setConfirmingDelete(false), 3500);
    return () => clearTimeout(t);
  }, [confirmingDelete]);

  const close = () => dialogRef.current?.close();

  const save = async () => {
    const amountCents = parseAmountToCents(amount);
    if (!amountCents) {
      setError("Enter an amount greater than 0.");
      return;
    }
    setBusy(true);
    setError(null);

    // Changing the day keeps the original time of day.
    let occurredAt = original;
    if (date !== toDateInputValue(original)) {
      const [y, m, d] = date.split("-").map(Number);
      occurredAt = new Date(y, m - 1, d, original.getHours(), original.getMinutes());
    }
    const cleanNote = note.trim();

    try {
      // Full payload (not a partial patch): the sync endpoint validates the
      // whole record, so partial edits would be rejected after going offline.
      await enqueueTransaction(userId, {
        clientId: tx.clientId,
        amountCents,
        currencyCode: tx.currencyCode ?? DEFAULT_CURRENCY,
        note: cleanNote, // "" clears the note
        occurredAt: occurredAt.toISOString(),
        clientUpdatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to save edit:", err);
      setError("Couldn't save the change. Please try again.");
      setBusy(false);
      return;
    }
    onSaved({
      ...tx,
      amountCents,
      note: cleanNote || null,
      occurredAt: occurredAt.toISOString(),
      pending: true,
    });
    close();
  };

  const remove = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setBusy(true);
    try {
      await enqueueTransactionDelete(userId, tx.clientId);
    } catch (err) {
      console.error("Failed to delete:", err);
      setError("Couldn't delete. Please try again.");
      setBusy(false);
      return;
    }
    onDeleted(tx.clientId);
    close();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && close()}
      aria-labelledby="sheet-title"
      className="sheet fixed inset-x-0 bottom-0 top-auto m-0 mx-auto max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-b-0 border-border bg-card p-0 text-foreground"
    >
      <div className="space-y-4 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <h2 id="sheet-title" className="text-lg font-bold">
            Edit expense
          </h2>
          <Button variant="ghost" size="sm" onClick={close} aria-label="Close" className="-mr-2 w-10 px-0">
            <X className="h-5 w-5" aria-hidden />
          </Button>
        </div>

        <Field label={`Amount (${tx.currencyCode ?? DEFAULT_CURRENCY})`} htmlFor="edit-amount">
          <input
            id="edit-amount"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            onChange={(e) => {
              const next = sanitizeAmountInput(e.target.value);
              if (next !== null) setAmount(next);
              setError(null);
            }}
            className={`${inputClass} text-2xl font-bold tabular-nums`}
          />
        </Field>

        <Field label="Note" htmlFor="edit-note">
          <input
            id="edit-note"
            value={note}
            maxLength={300}
            autoComplete="off"
            placeholder="What was it for?"
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field
          label="Date"
          htmlFor="edit-date"
          hint={`Time stays ${format(original, "h:mm a")}`}
        >
          <input
            id="edit-date"
            type="date"
            value={date}
            max={toDateInputValue(new Date())}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className={inputClass}
          />
        </Field>

        {error && <Notice tone="error">{error}</Notice>}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button
            variant={confirmingDelete ? "danger-solid" : "danger"}
            onClick={remove}
            disabled={busy}
          >
            <Trash2 className="h-5 w-5" aria-hidden />
            {confirmingDelete ? "Tap to confirm" : "Delete"}
          </Button>
          <Button onClick={save} loading={busy} disabled={busy}>
            Save
          </Button>
        </div>
      </div>
    </dialog>
  );
}
