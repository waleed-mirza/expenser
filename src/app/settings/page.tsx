"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { UnauthorizedPanel } from "@/components/UnauthorizedPanel";
import { AppLayout } from "@/components/AppLayout";
import { Loader2 } from "lucide-react";

const currencies = ["PKR", "USD", "EUR", "GBP", "INR", "AED", "AUD", "CAD"];

export default function SettingsPage() {
  const { data, status } = useSession();
  const [currency, setCurrency] = useState("PKR");
  const [timezone, setTimezone] = useState("Asia/Karachi");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setCurrency(data.settings?.currencyCode ?? "PKR");
          setTimezone(data.timezone ?? "Asia/Karachi");
        }
      })
      .catch(() => null);
  }, [status]);

  const save = async () => {
    setMessage(null);
    const res = await fetch("/api/me", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currencyCode: currency, timezone }),
    });
    if (res.ok) {
      setMessage("Settings saved.");
    } else {
      setMessage("Failed to save settings.");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <UnauthorizedPanel />
      </div>
    );
  }

  return (
    <AppLayout title="Settings" userEmail={data?.user?.email}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">Profile</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Email: {data?.user?.email}
          </p>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-foreground">
              Preferred currency
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-foreground">
              Timezone
              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </label>
            {message && <p className="text-sm text-emerald-500">{message}</p>}
            <button
              onClick={save}
              className="rounded-lg bg-primary px-4 py-2 text-primary-foreground font-semibold shadow-md shadow-primary/20 transition hover:bg-primary/90"
            >
              Save Changes
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">Account</h3>
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="mt-3 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2 text-destructive font-semibold transition hover:bg-destructive/20"
          >
            Sign out
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
