"use client";

import Link from "next/link";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { SpendOverview } from "@/components/SpendOverview";
import { QuickRepeat } from "@/components/QuickRepeat";

/** Home: glanceable totals, one-tap repeats, quick add, then the latest entries. */
export function DashboardShell({ userId }: { userId?: string | null }) {
  const id = userId ?? undefined;

  return (
    <div className="space-y-5">
      <SpendOverview userId={id} />
      <QuickRepeat userId={id} />
      <TransactionForm />

      <section aria-label="Recent expenses" className="space-y-2">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="text-lg font-bold">Recent</h2>
          <Link
            href="/transactions"
            className="-my-2 py-2 text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            See all
          </Link>
        </div>
        <TransactionList userId={id} compact />
      </section>
    </div>
  );
}
