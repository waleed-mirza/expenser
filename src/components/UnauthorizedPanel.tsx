import Link from "next/link";

export function UnauthorizedPanel() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white/90 p-8 text-center shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
        Access restricted
      </p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Please sign in to continue
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Your session is missing or expired. Log in to reach your dashboard, or
        create a new account if you are just starting.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/signin"
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}
