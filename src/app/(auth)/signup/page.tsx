"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Field, Notice, inputClass } from "@/components/ui/field";

const DEFAULT_TIMEZONE = "Asia/Karachi";
const noopSubscribe = () => () => {};

function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

const currencies = ["PKR", "USD", "EUR", "GBP", "INR", "AED", "AUD", "CAD"];

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const detectedTimezone = useSyncExternalStore(
    noopSubscribe,
    getBrowserTimezone,
    () => DEFAULT_TIMEZONE
  );
  const [timezoneChoice, setTimezoneChoice] = useState<string | null>(null);
  const timezone = timezoneChoice ?? detectedTimezone;
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, currency, timezone }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Couldn't create the account.");
        setLoading(false);
        return;
      }
      setMessage("Account created. Taking you to sign in…");
      setTimeout(() => router.push("/signin"), 800);
    } catch {
      setError(
        navigator.onLine
          ? "Something went wrong. Please try again."
          : "You're offline. Connect to create an account."
      );
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Takes under a minute.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 6 characters.">
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={6}
          />
        </Field>

        <details className="group rounded-xl border border-border bg-card">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-base font-semibold [&::-webkit-details-marker]:hidden">
            <span>
              More options{" "}
              <span className="font-normal text-muted-foreground">
                · {currency}, {timezone}
              </span>
            </span>
            <ChevronDown
              className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <div className="space-y-4 border-t border-border p-4">
            <Field label="Name (optional)" htmlFor="name">
              <input
                id="name"
                value={name}
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </Field>
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
                value={timezone}
                autoCapitalize="off"
                spellCheck={false}
                onChange={(e) => setTimezoneChoice(e.target.value)}
                required
                className={inputClass}
              />
            </Field>
          </div>
        </details>

        {message && <Notice tone="success">{message}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-base text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="inline-block py-2 font-semibold text-primary underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
