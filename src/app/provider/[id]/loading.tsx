// src/app/provider/[id]/loading.tsx
export default function ProviderLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      {/* Cover skeleton */}
      <div className="h-48 sm:h-56 bg-gray-200 rounded-2xl mb-6" />

      {/* Profile header skeleton */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
        <div className="w-28 h-28 rounded-full bg-gray-200 -mt-14 border-4 border-white" />
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-gray-200 rounded-xl w-20" />
          <div className="h-10 bg-gray-200 rounded-xl w-24" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-48 bg-gray-200 rounded-2xl" />
        <div className="h-48 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  );
}