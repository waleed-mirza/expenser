import { getAuthSession } from "@/lib/auth";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { UnauthorizedPanel } from "@/components/UnauthorizedPanel";

export default async function AnalyticsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) return <UnauthorizedPanel />;
  return <AnalyticsDashboard />;
}
