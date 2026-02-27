export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 animate-pulse">
      <div className="h-3 w-32 bg-gray-800 rounded mb-8" />
      <div className="h-10 w-72 bg-gray-800 rounded mb-2" />
      <div className="h-3 w-24 bg-gray-800 rounded mb-8" />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Price card skeleton */}
          <div className="card space-y-4">
            <div className="h-6 w-48 bg-gray-800 rounded" />
            <div className="h-14 w-40 bg-gray-800 rounded" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-800 rounded" />
              ))}
            </div>
          </div>
          {/* Chart skeleton */}
          <div className="card h-[260px] bg-gray-800" />
          {/* AI summary skeleton */}
          <div className="card space-y-3">
            <div className="h-4 w-20 bg-gray-800 rounded" />
            <div className="h-6 w-3/4 bg-gray-700 rounded" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-3 w-full bg-gray-800 rounded" />
              ))}
            </div>
          </div>
          {/* News skeleton */}
          <div className="card space-y-4">
            <div className="h-4 w-28 bg-gray-800 rounded" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-16 h-12 bg-gray-800 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-full bg-gray-800 rounded" />
                  <div className="h-3 w-2/3 bg-gray-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="card h-48 bg-gray-800" />
          <div className="card h-24 bg-gray-800" />
        </div>
      </div>
    </div>
  );
}
