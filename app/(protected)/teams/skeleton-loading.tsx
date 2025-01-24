import { Skeleton } from "@/components/ui/skeleton"

export function TeamsSkeletonLoading() {
  return (
    <div className="container">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="border-b">
          <div className="grid grid-cols-4 p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="grid grid-cols-4 border-b p-4 last:border-0">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-32" />
            <div className="flex justify-end gap-2">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
