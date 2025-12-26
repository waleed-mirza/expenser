"use client";

import { useState } from "react";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { SyncStatus } from "@/components/SyncStatus";
import { Nav } from "@/components/Nav";

export function DashboardShell({
  userId,
  userEmail,
}: {
  userId?: string;
  userEmail?: string;
}) {
  const [refreshToken, setRefreshToken] = useState(0);

  const handleSaved = () => setRefreshToken((n) => n + 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenser</h1>
          <p className="text-sm text-slate-300">Welcome, {userEmail ?? ""}</p>
        </div>
        <Nav />
      </header>
      <main className="mt-6 max-w-5xl mx-auto space-y-6">
        <SyncStatus />
        <TransactionForm onSaved={handleSaved} />
        <TransactionList userId={userId} refreshToken={refreshToken} />
      </main>
    </div>
  );
}
