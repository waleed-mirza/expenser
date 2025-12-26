import { getAuthSession } from "@/lib/auth";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { UnauthorizedPanel } from "@/components/UnauthorizedPanel";
import { AppLayout } from "@/components/AppLayout";

export default async function AnalyticsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-background px-4 py-10">
        <UnauthorizedPanel />
      </div>
    );
  }

  return (
    <AppLayout title="Analytics" userEmail={session?.user?.email}>
      <AnalyticsDashboard />
    </AppLayout>
  );
}
