import { getAuthSession } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { AppLayout } from "@/components/AppLayout";

export default async function DashboardPage() {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  return (
    <AppLayout title="Dashboard" userEmail={session?.user?.email}>
      <DashboardShell userId={userId} userEmail={session?.user?.email} />
    </AppLayout>
  );
}
