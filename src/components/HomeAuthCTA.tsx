"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function HomeAuthCTA() {
  const { data, status } = useSession();
  const loading = status === "loading";
  const user = data?.user;

  if (loading) {
    return (
      <div className="flex gap-3 text-sm text-slate-600" aria-live="polite">
        <span className="rounded-full bg-slate-200 px-4 py-2">Loading...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
        >
          Go to dashboard
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
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
        className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
      >
        Sign up
      </Link>
      <Link
        href="/signin"
        className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
      >
        Log in
      </Link>
    </div>
  );
}
