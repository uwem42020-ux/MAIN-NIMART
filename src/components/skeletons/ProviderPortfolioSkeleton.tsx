// src/components/skeletons/ProviderPortfolioSkeleton.tsx

export function ProviderPortfolioSkeleton() {
  return (
    <div className="min-h-screen bg-black flex flex-col animate-pulse">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        {/* Back button */}
        <div className="bg-white/10 backdrop-blur-sm p-2 rounded-full">
          <div className="h-5 w-5 bg-white/20 rounded-full" />
        </div>
        {/* Counter */}
        <div className="h-4 w-12 bg-white/20 rounded" />
        {/* Spacer */}
        <div className="w-10" />
      </div>

      {/* Main image area */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* Placeholder for the large image */}
        <div className="w-4/5 max-w-lg aspect-[3/4] bg-white/10 rounded-lg" />

        {/* Navigation arrows */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 backdrop-blur-sm rounded-full">
          <div className="h-6 w-6 bg-white/20 rounded-full" />
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 backdrop-blur-sm rounded-full">
          <div className="h-6 w-6 bg-white/20 rounded-full" />
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="py-3 px-4 bg-black/60 backdrop-blur-sm">
        <div className="flex gap-2 justify-center">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-16 h-16 rounded-lg bg-white/10"
            />
          ))}
        </div>
      </div>
    </div>
  );
}