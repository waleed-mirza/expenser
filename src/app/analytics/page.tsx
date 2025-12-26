import { getAuthSession } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { UnauthorizedPanel } from "@/components/UnauthorizedPanel";

export default async function AnalyticsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-10">
        <UnauthorizedPanel />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <Nav />
      </header>
      <main className="mt-6 max-w-5xl mx-auto space-y-6">
        <AnalyticsDashboard />
      </main>
    </div>
  );
}
