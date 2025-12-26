"use client";

import { Nav } from "@/components/Nav";
import { Wallet } from "lucide-react";
import { motion } from "framer-motion";

export function AppLayout({
  children,
  title,
  userEmail,
}: {
  children: React.ReactNode;
  title: string;
  userEmail?: string | null;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">Expenser</span>
          </div>
          <Nav />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {userEmail && (
             <p className="text-muted-foreground">Logged in as {userEmail}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
