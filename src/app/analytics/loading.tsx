import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/AppLayout";

export default function AnalyticsLoading() {
  return (
    <AppLayout title="Analytics">
       <div className="space-y-8 animate-pulse">
         <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
         </div>
         
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
               <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
         </div>

         <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
            <Skeleton className="h-80 lg:col-span-1 rounded-2xl" />
         </div>
       </div>
    </AppLayout>
  );
}
