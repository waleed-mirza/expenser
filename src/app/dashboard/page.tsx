import { getAuthSession } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

export default async function DashboardPage() {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  return <DashboardShell userId={userId} userEmail={session?.user?.email} />;
}
