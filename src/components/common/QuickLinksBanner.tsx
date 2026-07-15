// src/components/common/QuickLinksBanner.tsx
import Link from 'next/link';

interface QuickLinksBannerProps {
  onFindProviders: () => void;
}

export function QuickLinksBanner({ onFindProviders }: QuickLinksBannerProps) {
  return (
    <div className="mb-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory">
        {/* Find Providers – opens radar instead of navigating to /search */}
        <button
          onClick={onFindProviders}
          className="flex-shrink-0 w-[65%] sm:w-[30%] lg:w-auto snap-start text-left"
        >
          <div className="flex items-center gap-4 p-4 rounded-xl border bg-purple-50 border-purple-200">
            <img
              src="/search.png"
              alt="Find Providers"
              className="h-10 w-10 flex-shrink-0"
              width={40}
              height={40}
            />
            <div>
              <h3 className="font-semibold text-sm text-gray-900">Find Providers</h3>
              <p className="text-xs text-gray-600">Providers near you</p>
            </div>
          </div>
        </button>

        {/* Become a Provider – unchanged */}
        <Link
          href="/auth/signup?role=provider"
          className="flex-shrink-0 w-[65%] sm:w-[30%] lg:w-auto snap-start"
        >
          <div className="flex items-center gap-4 p-4 rounded-xl border bg-green-50 border-green-200">
            <img
              src="/provider.png"
              alt="Become a Provider"
              className="h-10 w-10 flex-shrink-0"
              width={40}
              height={40}
            />
            <div>
              <h3 className="font-semibold text-sm text-gray-900">Become a Provider</h3>
              <p className="text-xs text-gray-600">Offer your services</p>
            </div>
          </div>
        </Link>

        {/* How it Works – unchanged */}
        <Link
          href="/help"
          className="flex-shrink-0 w-[65%] sm:w-[30%] lg:w-auto snap-start"
        >
          <div className="flex items-center gap-4 p-4 rounded-xl border bg-blue-50 border-blue-200">
            <img
              src="/works.png"
              alt="How it Works"
              className="h-10 w-10 flex-shrink-0"
              width={40}
              height={40}
            />
            <div>
              <h3 className="font-semibold text-sm text-gray-900">How it Works</h3>
              <p className="text-xs text-gray-600">Learn about Nimart</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}