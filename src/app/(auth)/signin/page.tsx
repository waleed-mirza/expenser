"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Field, Notice, inputClass } from "@/components/ui/field";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });
      if (res?.error) {
        setError("Wrong email or password.");
        setLoading(false);
        return;
      }
      window.location.href = res?.url ?? "/dashboard";
    } catch {
      setError(
        navigator.onLine
          ? "Something went wrong. Please try again."
          : "You're offline. Connect to sign in."
      );
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to track your spending.">
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
        <Field label="Password" htmlFor="password">
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
        </Field>

        {error && <Notice tone="error">{error}</Notice>}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-base text-muted-foreground">
        New here?{" "}
        <Link
          href="/signup"
          className="inline-block py-2 font-semibold text-primary underline-offset-2 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
