"use client";

import { usePathname } from "next/navigation";
import { Nav, NAV_LINKS } from "@/components/Nav";
import { SyncStatus } from "@/components/SyncStatus";

/**
 * Persistent frame for every signed-in page: slim title bar, sync indicator
 * and the bottom tab bar. Lives in the (app) layout so it survives navigation
 * and the sync engine keeps running between pages.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title =
    NAV_LINKS.find(
      (l) => pathname === l.href || pathname.startsWith(`${l.href}/`)
    )?.title ?? "Expenser";

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-background pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between gap-3 px-4">
          <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
          <SyncStatus />
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4">
        {children}
      </main>

      <Nav />
    </div>
  );
}
