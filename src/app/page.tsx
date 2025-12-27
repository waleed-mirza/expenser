"use client";

import Link from "next/link";
import { HomeAuthCTA } from "@/components/HomeAuthCTA";
import { Wallet, ShieldCheck, Database, Sparkles, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 flex justify-center"
            >
              <motion.div
                className="rounded-full bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl px-4 py-2 text-sm leading-6 text-primary border border-primary/30 shadow-lg shadow-primary/20"
                whileHover={{ scale: 1.05 }}
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(139, 92, 246, 0.3)",
                    "0 0 40px rgba(139, 92, 246, 0.4)",
                    "0 0 20px rgba(139, 92, 246, 0.3)",
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✨ Expense tracking, reimagined
              </motion.div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl font-bold tracking-tight sm:text-7xl"
            >
              <span className="bg-gradient-to-r from-foreground via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Keep your finances
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                in sync anywhere
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-xl leading-8 text-muted-foreground"
            >
              Expenser works offline, syncs automatically, and gives you powerful insights.
              <br />
              Control your money with a modern, secure, and fast interface.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex items-center justify-center gap-x-6"
            >
              <HomeAuthCTA />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid gap-8 sm:grid-cols-3"
        >
          <FeatureCard
            index={0}
            icon={<Wallet className="h-6 w-6" />}
            title="Offline-first"
            body="Transactions queue locally with IndexedDB and sync when online."
            gradient="from-blue-500 to-cyan-500"
          />
          <FeatureCard
            index={1}
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Secure Login"
            body="Credentials-based login with JWT sessions via NextAuth."
            gradient="from-purple-500 to-pink-500"
          />
          <FeatureCard
            index={2}
            icon={<Database className="h-6 w-6" />}
            title="Prisma + Postgres"
            body="Reliable serverless PostgreSQL with robust schema management."
            gradient="from-pink-500 to-rose-500"
          />
        </motion.div>

        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-24 text-center"
        >
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Already have an account? Jump to dashboard
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </Link>
        </motion.footer>
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  body,
  icon,
  index,
  gradient,
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
  index: number;
  gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      <motion.div
        className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg shadow-primary/30`}
        whileHover={{ rotate: 5, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-bold leading-7 text-foreground mb-3">
        {title}
      </h3>
      <p className="text-base leading-7 text-muted-foreground">{body}</p>
    </motion.div>
  );
}
