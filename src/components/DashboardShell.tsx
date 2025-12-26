"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="lg:col-span-4 space-y-6 h-fit"
      >
        <SyncStatus />
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Quick Add</h2>
          <TransactionForm onSaved={handleSaved} />
        </div>
      </motion.div>

      {/* Right Column: Transactions List */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="lg:col-span-8"
      >
        <div className="rounded-xl border border-border/50 bg-card shadow-sm">
          <div className="border-b border-border/50 p-6">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
          </div>
          <div className="p-6">
            <TransactionList
              userId={userId ?? undefined}
              refreshToken={refreshToken}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
