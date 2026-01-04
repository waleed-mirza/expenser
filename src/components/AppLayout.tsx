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
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300" style={{ WebkitOverflowScrolling: 'touch' }}>
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-2xl backdrop-saturate-150 shadow-lg shadow-primary/5" style={{ WebkitTransform: 'translateZ(0)' }}>
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Wallet className="h-5 w-5" />
            </motion.div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Expenser
            </span>
          </motion.div>
          <Nav />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {userEmail && (
            <motion.p 
              className="text-muted-foreground mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Logged in as <span className="text-muted-foreground">{userEmail}</span>
            </motion.p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
