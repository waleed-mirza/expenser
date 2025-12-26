"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function HomeAuthCTA() {
  const { data, status } = useSession();
  const loading = status === "loading";
  const user = data?.user;

  if (loading) {
    return (
      <div className="flex gap-3 text-sm text-muted-foreground" aria-live="polite">
        <span className="rounded-full bg-muted px-4 py-2 animate-pulse">Loading...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
        >
          Go to dashboard
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-full border border-input bg-background/50 backdrop-blur-sm px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/signup"
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
      >
        Sign up
      </Link>
      <Link
        href="/signin"
        className="rounded-full border border-input bg-background/50 backdrop-blur-sm px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
      >
        Log in
      </Link>
    </div>
  );
}
