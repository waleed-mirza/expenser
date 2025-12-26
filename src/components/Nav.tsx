import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  return (
    <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="rounded-lg bg-slate-800/70 px-3 py-1 font-medium hover:bg-slate-700"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
