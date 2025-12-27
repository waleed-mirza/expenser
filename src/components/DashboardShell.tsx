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
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 100 }}
        className="lg:col-span-4 space-y-6 h-fit"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <SyncStatus />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border-2 border-border/50 bg-card/60 backdrop-blur-xl p-6 shadow-xl hover:shadow-2xl transition-all overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 opacity-0 hover:opacity-100 transition-opacity" />
          <h2 className="mb-5 text-xl font-bold text-foreground relative z-10">
            Quick Add
          </h2>
          <div className="relative z-10">
            <TransactionForm onSaved={handleSaved} />
          </div>
        </motion.div>
      </motion.div>

      {/* Right Column: Transactions List */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
        className="lg:col-span-8"
      >
        <div className="rounded-2xl border-2 border-border/50 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden">
          <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm p-6">
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
      </motion.div>
    </div>
  );
}
