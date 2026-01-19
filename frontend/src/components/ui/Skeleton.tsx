interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="h-64 flex items-end justify-around gap-2">
        <Skeleton className="h-1/3 w-12" />
        <Skeleton className="h-1/2 w-12" />
        <Skeleton className="h-2/3 w-12" />
        <Skeleton className="h-1/2 w-12" />
        <Skeleton className="h-3/4 w-12" />
        <Skeleton className="h-1/3 w-12" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>

      {/* Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonList count={5} />
        <SkeletonList count={5} />
      </div>
    </div>
  )
}
