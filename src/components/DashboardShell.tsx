"use client";

import { useState } from "react";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { SyncStatus } from "@/components/SyncStatus";

export function DashboardShell({
  userId,
}: {
  userId?: string | null;
  userEmail?: string | null; // We can remove this from props if unused
}) {
  const [refreshToken, setRefreshToken] = useState(0);

  const handleSaved = () => setRefreshToken((n) => n + 1);

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Left Column: Quick Actions & Status */}
      <div className="lg:col-span-4 space-y-6 h-fit">
        <SyncStatus />
        <div className="rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm p-6 shadow-xl transition-all overflow-hidden">
          <h2 className="mb-5 text-xl font-bold text-foreground">
            Quick Add
          </h2>
          <TransactionForm onSaved={handleSaved} />
        </div>
      </div>

      {/* Right Column: Transactions List */}
      <div className="lg:col-span-8">
        <div className="rounded-2xl border-2 border-border/50 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
          <div className="border-b border-border/50 bg-card/90 p-6">
            <h2 className="text-xl font-bold text-foreground">
              Recent Transactions
            </h2>
          </div>
          <div className="p-6">
            <TransactionList
              userId={userId ?? undefined}
              refreshToken={refreshToken}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
