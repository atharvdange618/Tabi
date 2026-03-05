import { Skeleton } from "@/components/ui/skeleton";

export default function TripLoading() {
  return (
    <div className="w-full h-full flex flex-col gap-6 animate-pulse">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg ml-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
