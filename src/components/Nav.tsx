"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CreditCard, BarChart3, Settings } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: CreditCard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={twMerge(
              clsx(
                "flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-all shadow-sm",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border/40 bg-card/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-border"
              )
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline-block">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
