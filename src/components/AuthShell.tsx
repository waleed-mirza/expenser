import { Wallet } from "lucide-react";

/** Shared frame for sign-in / sign-up: brand, heading, then the form. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Wallet className="h-6 w-6" aria-hidden />
        </span>
        <span className="text-2xl font-bold tracking-tight">Expenser</span>
      </div>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1.5 text-base text-muted-foreground">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </main>
  );
}
