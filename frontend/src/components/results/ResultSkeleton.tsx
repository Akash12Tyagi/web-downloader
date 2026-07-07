import { Skeleton } from '@/components/ui/Skeleton';

export function ResultSkeleton() {
  return (
    <div className="mx-auto mt-8 w-full max-w-4xl px-4">
      <div className="card-surface flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center">
        <Skeleton className="aspect-video w-full shrink-0 sm:w-56" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
