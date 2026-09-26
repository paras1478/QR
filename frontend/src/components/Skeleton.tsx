export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800 ${className}`} />;
}

export function FileCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <Skeleton className="mb-3 h-10 w-10" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
