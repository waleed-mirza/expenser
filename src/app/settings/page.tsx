"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { UnauthorizedPanel } from "@/components/UnauthorizedPanel";
import { AppLayout } from "@/components/AppLayout";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border-2 border-border/50 bg-card/60 backdrop-blur-xl p-8 shadow-xl"
        >
          <h3 className="text-xl font-bold text-foreground mb-2">Profile</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Email: <span className="font-medium text-foreground/80">{data?.user?.email}</span>
          </p>
          <div className="space-y-5">
            <label className="block text-sm font-semibold text-foreground">
              Preferred currency
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-2 w-full rounded-xl border-2 border-border/50 bg-background/60 backdrop-blur-sm px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-foreground">
              Timezone
              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-2 w-full rounded-xl border-2 border-border/50 bg-background/60 backdrop-blur-sm px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </label>
            {message && (
              <motion.p
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-sm font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2"
              >
                {message}
              </motion.p>
            )}
            <motion.button
              onClick={save}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="rounded-lg bg-primary px-6 py-3 text-primary-foreground font-semibold shadow-md hover:bg-primary/90 transition-colors"
            >
              Save Changes
            </motion.button>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border-2 border-border/50 bg-card/60 backdrop-blur-xl p-8 shadow-xl"
        >
          <h3 className="text-xl font-bold text-foreground mb-6">Account</h3>
          <motion.button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl bg-destructive/10 border-2 border-destructive/30 px-6 py-3 text-destructive font-bold transition-all hover:bg-destructive/20 hover:border-destructive/40"
          >
            Sign out
          </motion.button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
