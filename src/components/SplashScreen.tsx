"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // Show splash for 2.5 seconds
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
               <Image
                 src="/images/splash-bg.png"
                 alt="Background"
                 fill
                 className="object-cover opacity-60"
                 priority
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80" />
            </div>

            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ 
                duration: 1.2, 
                ease: [0.22, 1, 0.36, 1],
                delay: 0.2 
              }}
              className="relative z-10 flex flex-col items-center gap-6"
            >
              <div className="relative h-32 w-32 overflow-hidden rounded-2xl shadow-2xl shadow-indigo-500/30 ring-1 ring-white/10 sm:h-40 sm:w-40">
                <Image
                  src="/logo.png"
                  alt="Expenser Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
              >
                Expenser
              </motion.h1>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 
        Ideally, we render children immediately but hidden, or render them after. 
        Rendering after ensures no flash of unstyled content, but might delay hydration.
        Let's render concurrently but cover with splash.
      */}
      {children}
    </>
  );
}
