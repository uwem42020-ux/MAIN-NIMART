// src/components/skeletons/ProviderProfileSkeleton.tsx

export function ProviderProfileSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 animate-pulse">
      {/* ========== MOBILE SKELETON (hidden on md+) ========== */}
      <div className="block md:hidden">
        {/* Cover placeholder */}
        <div className="h-48 sm:h-52 bg-gray-200 rounded-none" />

        {/* Avatar */}
        <div className="flex justify-center -mt-14 mb-4 px-4">
          <div className="w-28 h-28 rounded-full bg-gray-300 border-4 border-white" />
        </div>

        {/* Name + category */}
        <div className="px-4 mb-4">
          <div className="bg-white rounded-2xl p-4 space-y-2">
            <div className="h-5 w-48 bg-gray-200 rounded mx-auto" />
            <div className="h-4 w-32 bg-gray-200 rounded mx-auto" />
            <div className="h-4 w-20 bg-gray-200 rounded mx-auto" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-4 mb-6 flex justify-center gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-14 h-14 bg-gray-200 rounded-xl" />
          ))}
        </div>

        {/* Stats chips */}
        <div className="px-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-7 w-24 bg-gray-200 rounded-full" />
            ))}
          </div>
        </div>

        {/* Portfolio section */}
        <div className="px-4 mb-6">
          <div className="h-5 w-24 bg-gray-200 rounded mb-3" />
          <div className="flex gap-3 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-40 h-40 bg-gray-200 rounded-2xl flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="px-4 mb-6">
          <div className="h-5 w-24 bg-gray-200 rounded mb-3" />
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex justify-between items-start bg-gray-50 rounded-2xl p-4 mb-3">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-48 bg-gray-200 rounded" />
              </div>
              <div className="ml-3 text-right space-y-1">
                <div className="h-4 w-16 bg-gray-200 rounded" />
                <div className="h-3 w-12 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* About */}
        <div className="px-4 mb-6">
          <div className="bg-white rounded-2xl p-5 space-y-3">
            <div className="h-5 w-20 bg-gray-200 rounded" />
            <div className="h-3 w-full bg-gray-200 rounded" />
            <div className="h-3 w-2/3 bg-gray-200 rounded" />
            <div className="flex flex-wrap gap-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-6 w-24 bg-gray-200 rounded-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="px-4 pb-8">
          <div className="h-5 w-24 bg-gray-200 rounded mb-3" />
          <div className="bg-white rounded-2xl p-4 space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="w-4 h-4 rounded-full bg-gray-200" />
                    ))}
                  </div>
                </div>
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========== DESKTOP SKELETON (hidden below md) ========== */}
      <div className="hidden md:block">
        {/* Breadcrumb + back button */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-12 bg-gray-200 rounded" />
          <div className="h-4 w-4 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
        </div>
        <div className="h-8 w-32 bg-gray-200 rounded mb-4" />

        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          {/* Cover */}
          <div className="h-56 bg-gray-200" />

          {/* Info row */}
          <div className="relative px-6 sm:px-8 -mt-12 pb-6 flex flex-col sm:flex-row items-center sm:items-end gap-4">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full bg-gray-300 border-4 border-white flex-shrink-0" />

            {/* Name + status */}
            <div className="flex-1 space-y-2 mt-4 sm:mt-0 sm:ml-4">
              <div className="h-7 w-56 bg-gray-200 rounded" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-96 bg-gray-200 rounded" />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-4 sm:mt-0">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 w-10 sm:w-24 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <div className="mx-6 border-t border-gray-100 pt-4 pb-4">
            <div className="flex flex-wrap gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-7 w-28 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        {/* Two-column: Services + Portfolio */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Services card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex justify-between items-start p-3 bg-gray-50 rounded-xl">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-48 bg-gray-200 rounded" />
                  </div>
                  <div className="text-right space-y-1">
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                    <div className="h-3 w-12 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        {/* About + Reviews columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* About card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="h-6 w-20 bg-gray-200 rounded" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-gray-200 rounded" />
              <div className="h-3 w-3/4 bg-gray-200 rounded" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 w-24 bg-gray-200 rounded-full" />
              ))}
            </div>
          </div>

          {/* Reviews card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="h-6 w-24 bg-gray-200 rounded" />
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="w-4 h-4 rounded-full bg-gray-200" />
                    ))}
                  </div>
                </div>
                <div className="h-3 w-full bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}