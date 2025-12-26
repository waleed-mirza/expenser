import { getAuthSession } from "@/lib/auth";
import { TransactionList } from "@/components/TransactionList";
import { Nav } from "@/components/Nav";

export default async function TransactionsPage() {
  const session = await getAuthSession();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">All Transactions</h1>
        <Nav />
      </header>
      <main className="mt-6 max-w-3xl mx-auto">
        <TransactionList userId={session?.user?.id} />
      </main>
    </div>
  );
}
