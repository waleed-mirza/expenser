import Link from "next/link";
import { HomeAuthCTA } from "@/components/HomeAuthCTA";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-indigo-50">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <header className="flex flex-col gap-6 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
            Expense tracking, anywhere
          </p>
          <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
            Expenser keeps your finances in sync—online or offline.
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Add expenses even without a connection, sync automatically when you
            are back online, and view timezone-aware analytics.
          </p>
          <HomeAuthCTA />
        </header>

        <section className="mt-12 grid gap-6 sm:grid-cols-3">
          <FeatureCard
            title="Offline-first"
            body="Transactions queue locally with IndexedDB and sync when online."
          />
          <FeatureCard
            title="Secure auth"
            body="Credentials-based login with JWT sessions via NextAuth."
          />
          <FeatureCard
            title="Prisma + Neon"
            body="Serverless Postgres with Prisma-managed schema and idempotent upserts."
          />
        </section>

        <footer className="mt-16 text-center text-sm text-slate-500">
          <Link
            href="/dashboard"
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Jump to dashboard
          </Link>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}
