import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/AppLayout";

export default function DashboardLoading() {
  return (
    <AppLayout title="Dashboard">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-6 h-fit">
          {/* Sync Status Skeleton */}
          <div className="flex flex-col gap-2 rounded-xl border border-border/50 bg-card p-4 shadow-sm">
             <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-20 rounded-full" />
             </div>
             <Skeleton className="h-10 w-full mt-2" />
          </div>
          
          {/* Form Skeleton */}
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm space-y-4">
             <Skeleton className="h-6 w-32" />
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
          </div>
        </div>

        <div className="lg:col-span-8">
           <div className="rounded-xl border border-border/50 bg-card shadow-sm">
              <div className="border-b border-border/50 p-6">
                 <Skeleton className="h-6 w-48" />
              </div>
              <div className="p-6 space-y-4">
                 {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex h-20 w-full rounded-xl border border-border bg-card p-4 shadow-sm items-center justify-between">
                       <div className="space-y-2">
                          <Skeleton className="h-6 w-24" />
                          <Skeleton className="h-4 w-32" />
                       </div>
                       <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </AppLayout>
  );
}
