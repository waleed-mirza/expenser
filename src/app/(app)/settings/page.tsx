"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import { LogOut, Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { clearLocalData, getQueuedOps } from "@/lib/idb";
import { signOutAndClearCaches } from "@/lib/sign-out";
import { getStoredTheme, setTheme, type ThemePreference } from "@/lib/theme";
import { UnauthorizedPanel } from "@/components/UnauthorizedPanel";
import { Button } from "@/components/ui/button";
import { Field, Notice, inputClass } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const currencies = ["PKR", "USD", "EUR", "GBP", "INR", "AED", "AUD", "CAD"];

const themes: { key: ThemePreference; label: string; icon: typeof Sun }[] = [
  { key: "system", label: "Auto", icon: Monitor },
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
];

const themeListeners = new Set<() => void>();
const subscribeTheme = (cb: () => void) => {
  themeListeners.add(cb);
  return () => void themeListeners.delete(cb);
};

function timezoneOptions(): string[] {
  try {
    return (Intl as unknown as { supportedValuesOf(k: string): string[] }).supportedValuesOf(
      "timeZone"
    );
  } catch {
    return [];
  }
}

export default function SettingsPage() {
  const { data, status } = useSession();
  const [currency, setCurrency] = useState("PKR");
  const [timezone, setTimezone] = useState("Asia/Karachi");
  const [saved, setSaved] = useState({ currency: "PKR", timezone: "Asia/Karachi" });
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const theme = useSyncExternalStore(subscribeTheme, getStoredTheme, () => "system" as const);
  const [zones] = useState(timezoneOptions);
  const [unsynced, setUnsynced] = useState(0);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    getQueuedOps(500)
      .then((ops) => setUnsynced(ops.length))
      .catch(() => null);
  }, []);

  // The destructive action needs a second tap; arming times out.
  useEffect(() => {
    if (!confirmingReset) return;
    const t = setTimeout(() => setConfirmingReset(false), 4000);
    return () => clearTimeout(t);
  }, [confirmingReset]);

  const resetLocal = async () => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    setResetting(true);
    setResetError(null);
    try {
      await clearLocalData();
      // Reload so every screen re-reads from the server with an empty cache.
      window.location.reload();
    } catch {
      setResetError("Couldn't clear local data. Please try again.");
      setResetting(false);
      setConfirmingReset(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (!me) return;
        const loaded = {
          currency: me.settings?.currencyCode ?? "PKR",
          timezone: me.timezone ?? "Asia/Karachi",
        };
        setCurrency(loaded.currency);
        setTimezone(loaded.timezone);
        setSaved(loaded);
      })
      .catch(() => null);
  }, [status]);

  const dirty = currency !== saved.currency || timezone !== saved.timezone;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/me", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currencyCode: currency, timezone: timezone.trim() }),
      });
      if (!res.ok) throw new Error("save");
      setSaved({ currency, timezone: timezone.trim() });
      setMessage({ tone: "success", text: "Settings saved." });
    } catch {
      setMessage({
        tone: "error",
        text: navigator.onLine
          ? "Couldn't save settings. Check the time zone and try again."
          : "You're offline. Settings can only be saved when connected.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    );
  }

  if (status === "unauthenticated") return <UnauthorizedPanel />;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-muted-foreground">Signed in as</p>
        <p className="mt-0.5 truncate text-base font-semibold">{data?.user?.email}</p>
      </section>

      <section aria-labelledby="appearance" className="rounded-2xl border border-border bg-card p-4">
        <h2 id="appearance" className="mb-3 text-base font-bold">
          Appearance
        </h2>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
          {themes.map(({ key, label, icon: Icon }) => {
            const active = theme === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setTheme(key);
                  themeListeners.forEach((l) => l());
                }}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 text-sm font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <form
        onSubmit={save}
        aria-labelledby="preferences"
        className="space-y-4 rounded-2xl border border-border bg-card p-4"
      >
        <h2 id="preferences" className="text-base font-bold">
          Preferences
        </h2>
        <Field label="Currency" htmlFor="currency">
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={inputClass}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Time zone"
          htmlFor="timezone"
          hint="Decides where each day and week starts."
        >
          <input
            id="timezone"
            list="timezones"
            value={timezone}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            onChange={(e) => setTimezone(e.target.value)}
            className={inputClass}
          />
          <datalist id="timezones">
            {zones.map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
        </Field>
        {message && <Notice tone={message.tone}>{message.text}</Notice>}
        <Button type="submit" size="lg" loading={saving} disabled={!dirty} className="w-full">
          Save changes
        </Button>
      </form>

      <section aria-labelledby="storage" className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <h2 id="storage" className="text-base font-bold">
          Data on this device
        </h2>
        <p className="text-sm text-muted-foreground">
          Clears the offline copy of your expenses stored on this device, so it
          starts fresh. Your account and everything saved online are not
          touched.
        </p>
        {unsynced > 0 && (
          <Notice tone="warning">
            {unsynced} change{unsynced === 1 ? " hasn't" : "s haven't"} synced yet and
            will be lost if you reset now.
          </Notice>
        )}
        {resetError && <Notice tone="error">{resetError}</Notice>}
        <Button
          variant={confirmingReset ? "danger-solid" : "danger"}
          size="lg"
          className="w-full"
          loading={resetting}
          onClick={() => void resetLocal()}
        >
          <Trash2 className="h-5 w-5" aria-hidden />
          {confirmingReset ? "Tap again to confirm" : "Reset local data"}
        </Button>
      </section>

      <Button
        variant="danger"
        size="lg"
        className="w-full"
        loading={signingOut}
        onClick={() => {
          setSigningOut(true);
          void signOutAndClearCaches("/signin");
        }}
      >
        <LogOut className="h-5 w-5" aria-hidden />
        Sign out
      </Button>
    </div>
  );
}
