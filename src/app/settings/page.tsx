"use client";

import { useSession, signOut } from "next-auth/react";
import { Nav } from "@/components/Nav";
import { useEffect, useState } from "react";
import { UnauthorizedPanel } from "@/components/UnauthorizedPanel";

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
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-6">
        <div className="mx-auto max-w-2xl text-center text-sm text-slate-200">
          Checking session...
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-10">
        <UnauthorizedPanel />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Nav />
      </header>
      <main className="mt-6 max-w-2xl mx-auto space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Profile</h3>
          <p className="text-sm text-slate-600 mt-1">
            Email: {data?.user?.email}
          </p>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Preferred currency
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-indigo-400 focus:outline-none"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Timezone
              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-indigo-400 focus:outline-none"
              />
            </label>
            {message && <p className="text-sm text-emerald-600">{message}</p>}
            <button
              onClick={save}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-white font-semibold transition hover:bg-indigo-400"
            >
              Save
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Account</h3>
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="mt-3 rounded-lg bg-red-500 px-4 py-2 text-white font-semibold transition hover:bg-red-400"
          >
            Sign out
          </button>
        </div>
      </main>
    </div>
  );
}
