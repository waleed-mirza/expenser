import { getAuthSession } from "@/lib/auth";
import { TransactionList } from "@/components/TransactionList";

export default async function TransactionsPage() {
  const session = await getAuthSession();
  return <TransactionList userId={session?.user?.id} />;
}
