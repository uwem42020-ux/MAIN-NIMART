// src/app/search/loading.tsx
import { ProviderGridSkeleton } from '@/components/skeletons/ProviderGridSkeleton';

export default function SearchLoading() {
  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-8 py-6">
      <div className="px-4 sm:px-0 mb-4">
        <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="hidden lg:block lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded" />
            ))}
          </div>
        </aside>
        <main className="flex-1 min-w-0 px-4 sm:px-0">
          <div className="h-12 bg-gray-200 rounded-xl mb-5 animate-pulse" />
          <div className="flex items-center justify-between mb-5 gap-3">
            <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
          <ProviderGridSkeleton />
        </main>
      </div>
    </div>
  );
}