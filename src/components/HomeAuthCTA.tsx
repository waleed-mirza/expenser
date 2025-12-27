"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";

export function HomeAuthCTA() {
  const { data, status } = useSession();
  const loading = status === "loading";
  const user = data?.user;

  if (loading) {
    return (
      <div className="flex gap-3 text-sm text-muted-foreground" aria-live="polite">
        <span className="rounded-full bg-muted px-4 py-2 animate-pulse">Loading...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-wrap gap-3 justify-center">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          >
            Go to dashboard
          </Link>
        </motion.div>
        <motion.button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-full border-2 border-border/50 bg-background/80 backdrop-blur-xl px-8 py-3.5 text-sm font-semibold text-foreground hover:bg-card/80 hover:border-primary/30 transition-all shadow-lg"
        >
          Log out
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        >
          Get Started
        </Link>
      </motion.div>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Link
          href="/signin"
          className="rounded-full border-2 border-border/50 bg-background/80 backdrop-blur-xl px-8 py-3.5 text-sm font-semibold text-foreground hover:bg-card/80 hover:border-primary/30 transition-all shadow-lg"
        >
          Log in
        </Link>
      </motion.div>
    </div>
  );
}
