import { useCallback, useMemo, useSyncExternalStore } from "react";

const KEY = "expenser:recent-notes";
const MAX_NOTES = 8;
const DEFAULT_NOTES = ["Food", "Transport", "Groceries", "Bills"];

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

/**
 * Most-recently-used notes, shown as one-tap chips in the add form.
 * Stored on-device so it works offline and costs no network.
 */
export function useRecentNotes() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "");

  const notes = useMemo(() => {
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.filter((n): n is string => typeof n === "string");
      }
    } catch {
      // fall through to defaults
    }
    return DEFAULT_NOTES;
  }, [raw]);

  const remember = useCallback((note: string) => {
    const clean = note.trim();
    if (!clean) return;
    try {
      const current: string[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      const next = [
        clean,
        ...current.filter((n) => n.toLowerCase() !== clean.toLowerCase()),
      ].slice(0, MAX_NOTES);
      localStorage.setItem(KEY, JSON.stringify(next));
      listeners.forEach((l) => l());
    } catch {
      // Non-critical: chips just won't update.
    }
  }, []);

  return { notes, remember };
}
