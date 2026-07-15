import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { ProviderCard } from '../../components/provider/ProviderCard';
import { CategorySidebar } from '../../components/common/CategorySidebar';
import { useAuth } from '../../contexts/AuthContext';
import { calculateDistance } from '../../lib/distance';
import type { ProviderWithProfile } from '../../types/database';

export default function Home() {
  const { profile } = useAuth();

  const { data: featuredProviders, isLoading } = useQuery({
    queryKey: ['featured-providers', profile?.lat, profile?.lng],
    queryFn: async () => {
      let query = supabase
        .from('providers')
        .select(`
          *,
          profile:profiles(*),
          portfolio_images(*)
        `)
        .eq('is_available', true)
        .order('boost_until', { ascending: false, nullsFirst: false })
        .limit(8);

      const { data } = await query;

      if (!data) return [];

      // Calculate distance if user location available
      if (profile?.lat && profile?.lng) {
        return data.map((provider: any) => ({
          ...provider,
          distance: calculateDistance(
            profile.lat!,
            profile.lng!,
            provider.profile.lat,
            provider.profile.lng
          ),
        })).sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      }

      return data;
    },
    enabled: true,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <CategorySidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1">
          {/* Hero section */}
          <section className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 mb-8 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Find Trusted Service Providers in Nigeria
            </h1>
            <p className="text-lg opacity-90 mb-6">
              Connect with verified professionals for any service you need
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white rounded-lg p-1 flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="What service do you need?"
                  className="w-full px-4 py-2 text-gray-900 focus:outline-none"
                />
              </div>
              <button className="bg-accent-500 hover:bg-accent-600 text-white px-6 py-2 rounded-lg font-medium">
                Search
              </button>
            </div>
          </section>

          {/* Featured providers */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Featured Providers</h2>
              <button className="text-primary-600 hover:text-primary-700 font-medium">
                View all
              </button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-48" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProviders?.map((provider: ProviderWithProfile) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            )}
          </section>

          {/* Categories grid */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {/* Render popular categories */}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}