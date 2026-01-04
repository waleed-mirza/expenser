"use client";

import { Nav } from "@/components/Nav";
import { Wallet } from "lucide-react";

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
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-sm shadow-lg shadow-primary/5">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md active:scale-95 transition-transform">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Expenser
            </span>
          </div>
          <Nav />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {userEmail && (
            <p className="text-muted-foreground mt-2">
              Logged in as <span className="text-muted-foreground">{userEmail}</span>
            </p>
          )}
        </div>

        {children}
      </main>
    </div>
  );
}
