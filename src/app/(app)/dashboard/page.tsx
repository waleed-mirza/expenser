import { getAuthSession } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

export default async function DashboardPage() {
  const session = await getAuthSession();
  return <DashboardShell userId={session?.user?.id} />;
}
