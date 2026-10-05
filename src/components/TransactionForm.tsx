"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { v4 as uuid } from "uuid";
import { Calendar, Check } from "lucide-react";
import { format, subDays } from "date-fns";
import { enqueueTransaction } from "@/lib/sync";
import { DEFAULT_CURRENCY } from "@/lib/format";
import {
  dateInputToNoon,
  parseAmountToCents,
  sanitizeAmountInput,
  toDateInputValue,
} from "@/lib/transactions";
import { useOnline } from "@/hooks/useOnline";
import { useRecentNotes } from "@/hooks/useRecentNotes";
import { Button } from "@/components/ui/button";
import { Chip, chipClass } from "@/components/ui/chip";
import { Notice, inputClass } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/**
 * Quick add. Optimised for speed: amount first, one-tap note chips, Enter
 * saves, and the amount field is re-focused after saving for back-to-back
 * entries. Saving only writes to the device; syncing happens in the background.
 */
export function TransactionForm() {
  const { data } = useSession();
  const online = useOnline();
  const { notes, remember } = useRecentNotes();
  const userId = data?.user?.id;

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => toDateInputValue(new Date()));
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Offline cold starts have no session yet; submit falls back to this.
  useEffect(() => {
    if (userId) localStorage.setItem("lastUserId", userId);
  }, [userId]);

  useEffect(() => () => clearTimeout(savedTimer.current), []);

  const today = toDateInputValue(new Date());
  const yesterday = toDateInputValue(subDays(new Date(), 1));
  const customDate = date !== today && date !== yesterday;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const effectiveUserId = userId ?? localStorage.getItem("lastUserId");
    if (!effectiveUserId) {
      setError(
        online
          ? "You must be signed in."
          : "Offline save needs a prior sign-in on this device."
      );
      return;
    }

    const amountCents = parseAmountToCents(amount);
    if (!amountCents) {
      setError("Enter an amount greater than 0.");
      amountRef.current?.focus();
      return;
    }

    setError(null);
    setSaving(true);
    const now = new Date();
    try {
      await enqueueTransaction(effectiveUserId, {
        clientId: uuid(),
        amountCents,
        currencyCode: DEFAULT_CURRENCY,
        note: note.trim() || undefined,
        occurredAt: (date === today ? now : dateInputToNoon(date)).toISOString(),
        clientUpdatedAt: now.toISOString(),
        source: online ? "online" : "offline",
      });
    } catch (err) {
      console.error("Error saving transaction:", err);
      setError("Couldn't save on this device. Please try again.");
      setSaving(false);
      return;
    }

    remember(note);
    setAmount("");
    setNote("");
    setDate(today);
    setSaving(false);
    setJustSaved(true);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setJustSaved(false), 1500);
    navigator.vibrate?.(12);
    amountRef.current?.focus();
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-border bg-card p-4"
      noValidate
    >
      <div>
        <label htmlFor="amount" className="mb-1.5 block text-sm font-semibold">
          Amount
        </label>
        <div className="flex items-baseline gap-2 rounded-xl border-2 border-input px-4 py-2.5 focus-within:border-primary">
          <span className="text-lg font-semibold text-muted-foreground">
            {DEFAULT_CURRENCY}
          </span>
          <input
            ref={amountRef}
            id="amount"
            inputMode="decimal"
            autoComplete="off"
            enterKeyHint="next"
            placeholder="0"
            value={amount}
            onChange={(e) => {
              const next = sanitizeAmountInput(e.target.value);
              if (next !== null) setAmount(next);
              setError(null);
            }}
            className="w-full min-w-0 bg-transparent text-4xl font-bold tabular-nums placeholder:text-muted-foreground/70 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor="note" className="mb-1.5 block text-sm font-semibold">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="note"
          value={note}
          maxLength={300}
          autoComplete="off"
          enterKeyHint="done"
          placeholder="What was it for?"
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
        />
        <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Quick notes">
          {notes.slice(0, 6).map((n) => (
            <Chip key={n} active={note === n} onClick={() => setNote(note === n ? "" : n)}>
              {n}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Date">
        <Chip active={date === today} onClick={() => setDate(today)}>
          Today
        </Chip>
        <Chip active={date === yesterday} onClick={() => setDate(yesterday)}>
          Yesterday
        </Chip>
        <label className={cn(chipClass(customDate), "relative cursor-pointer")}>
          <Calendar className="h-4 w-4" aria-hidden />
          {customDate ? format(dateInputToNoon(date), "MMM d") : "Pick date"}
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            aria-label="Pick a date"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <Button
        type="submit"
        size="lg"
        loading={saving}
        className={cn(
          "w-full",
          justSaved && "bg-success text-white hover:bg-success dark:text-background"
        )}
      >
        {justSaved ? (
          <>
            <Check className="h-5 w-5" aria-hidden /> Saved
          </>
        ) : online ? (
          "Save expense"
        ) : (
          "Save offline"
        )}
      </Button>
      <p className="sr-only" role="status" aria-live="polite">
        {justSaved ? "Expense saved" : ""}
      </p>
      {!online && (
        <p className="text-center text-sm text-muted-foreground">
          You&apos;re offline. It&apos;s saved on this device and will sync when you&apos;re back online.
        </p>
      )}
    </form>
  );
}
