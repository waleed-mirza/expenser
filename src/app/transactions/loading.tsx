import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/AppLayout";

export default function TransactionsLoading() {
  return (
    <AppLayout title="All Transactions">
       <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
             <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
       </div>
    </AppLayout>
  );
}
