// src/components/skeletons/ProviderGridSkeleton.tsx

export function ProviderGridSkeleton() {
  return (
    <>
      {/* Desktop skeleton (hidden on mobile) */}
      <div className="hidden md:block columns-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="mb-4 break-inside-avoid animate-pulse">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="w-full aspect-[4/5] bg-gray-200" />
              <div className="p-3 sm:p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile skeleton (hidden on desktop) */}
      <div className="md:hidden px-2 columns-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mb-2 break-inside-avoid animate-pulse">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="w-full aspect-[4/5] bg-gray-200" />
              <div className="p-2 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-2 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}