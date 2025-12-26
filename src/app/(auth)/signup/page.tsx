"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const currencies = ["PKR", "USD", "EUR", "GBP", "INR", "AED", "AUD", "CAD"];

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [timezone, setTimezone] = useState("Asia/Karachi");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimezone(tz);
    } catch {
      setTimezone("Asia/Karachi");
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, currency, timezone }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to sign up");
      return;
    }
    setMessage("Account created. Redirecting to sign in...");
    setTimeout(() => router.push("/signin"), 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/70 border border-slate-700 p-8 shadow-2xl">
        <h1 className="text-2xl font-semibold mb-6">
          Create your Expenser account
        </h1>
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-medium">
            Name
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional"
            />
          </label>
          <label className="block text-sm font-medium">
            Email
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          <label className="block text-sm font-medium">
            Preferred currency
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Timezone (for day/week rollovers)
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
            />
          </label>
          {message && <p className="text-sm text-emerald-300">{message}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-500 py-2 font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-300">
          Already have an account?{" "}
          <Link
            className="text-indigo-300 hover:text-indigo-200"
            href="/signin"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
