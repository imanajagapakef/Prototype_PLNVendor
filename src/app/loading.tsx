export default function Loading() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-8">
        <div className="h-8 w-48 bg-line animate-pulse rounded"></div>
        <div className="h-10 w-32 bg-line animate-pulse rounded"></div>
      </div>

      {/* KPI strip skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-paper border border-line rounded-lg p-4">
          <div className="h-4 w-24 bg-line animate-pulse rounded mb-2"></div>
          <div className="h-8 w-16 bg-line animate-pulse rounded"></div>
        </div>
        <div className="bg-paper border border-line rounded-lg p-4">
          <div className="h-4 w-24 bg-line animate-pulse rounded mb-2"></div>
          <div className="h-8 w-16 bg-line animate-pulse rounded"></div>
        </div>
        <div className="bg-paper border border-line rounded-lg p-4">
          <div className="h-4 w-24 bg-line animate-pulse rounded mb-2"></div>
          <div className="h-8 w-16 bg-line animate-pulse rounded"></div>
        </div>
        <div className="bg-paper border border-line rounded-lg p-4">
          <div className="h-4 w-24 bg-line animate-pulse rounded mb-2"></div>
          <div className="h-8 w-16 bg-line animate-pulse rounded"></div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="space-y-6">
        <div className="h-12 w-full bg-line animate-pulse rounded"></div>
        <div className="h-64 w-full bg-line animate-pulse rounded"></div>
      </div>
    </div>
  );
}