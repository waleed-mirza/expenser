import { getAuthSession } from "@/lib/auth";
import { TransactionList } from "@/components/TransactionList";
import { AppLayout } from "@/components/AppLayout";

export default async function TransactionsPage() {
  const session = await getAuthSession();
  return (
    <AppLayout title="All Transactions" userEmail={session?.user?.email}>
      <TransactionList userId={session?.user?.id} />
    </AppLayout>
  );
}
