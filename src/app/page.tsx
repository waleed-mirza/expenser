import Link from "next/link";
import { HomeAuthCTA } from "@/components/HomeAuthCTA";
import { Wallet, ShieldCheck, Database } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="rounded-full bg-primary/10 px-3 py-1 text-sm leading-6 text-primary ring-1 ring-inset ring-primary/20">
                Expense tracking, reimagined
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Keep your finances in sync <span className="text-primary">anywhere</span>.
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Expenser works offline, syncs automatically, and gives you powerful insights.
              Control your money with a modern, secure, and fast interface.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <HomeAuthCTA />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="grid gap-8 sm:grid-cols-3">
          <FeatureCard
            icon={<Wallet className="h-6 w-6 text-primary" />}
            title="Offline-first"
            body="Transactions queue locally with IndexedDB and sync when online."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-6 w-6 text-primary" />}
            title="Secure Login"
            body="Credentials-based login with JWT sessions via NextAuth."
          />
          <FeatureCard
            icon={<Database className="h-6 w-6 text-primary" />}
            title="Prisma + Postgres"
            body="Reliable serverless PostgreSQL with robust schema management."
          />
        </div>

        <footer className="mt-24 text-center text-sm text-muted-foreground">
          <Link
            href="/dashboard"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Already have an account? Jump to dashboard &rarr;
          </Link>
        </footer>
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20 hover:bg-card/50">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-semibold leading-7 text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-base leading-7 text-muted-foreground">{body}</p>
    </div>
  );
}
