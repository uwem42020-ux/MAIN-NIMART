// src/components/search/EnhancedFilterSidebar.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TIERS, CATEGORIES, getSubcategoriesByCategory } from '../../data/categories';
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/supabase-any';
import { MapPin } from 'lucide-react';

interface State {
  state_id: number;
  state_name: string;
}

interface LGA {
  lga_id: number;
  lga_name: string;
}

export function EnhancedFilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedTier, setSelectedTier] = useState(searchParams.get('tier') || '');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get('subcategory') || '');

  const [states, setStates] = useState<State[]>([]);
  const [lgas, setLgas] = useState<LGA[]>([]);
  const [selectedState, setSelectedState] = useState(searchParams.get('state') || '');
  const [selectedLga, setSelectedLga] = useState(searchParams.get('lga') || '');

  const [statuses, setStatuses] = useState<string[]>(
    searchParams.get('status')?.split(',').filter(Boolean) || []
  );

  const [minRating, setMinRating] = useState(searchParams.get('rating') || '');

  // Helper to update URL params without full navigation
  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.replace(`/search?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Load states
  useEffect(() => {
    async function fetchStates() {
      const { data } = await db
        .from('lga_centers')
        .select('state_id, state_name')
        .order('state_name');
      const raw = (data || []) as any[];
      const unique = raw.filter((v, i, a) =>
        a.findIndex(t => t.state_id === v.state_id) === i
      );
      setStates(unique);
    }
    fetchStates();
  }, []);

  // Load LGAs when state changes
  useEffect(() => {
    if (!selectedState) {
      setLgas([]);
      return;
    }
    async function fetchLgas() {
      const { data } = await db
        .from('lga_centers')
        .select('lga_id, lga_name')
        .eq('state_id', parseInt(selectedState))
        .order('lga_name');
      setLgas((data || []) as LGA[]);
    }
    fetchLgas();
  }, [selectedState]);

  // Categories & subcategories
  useEffect(() => {
    if (selectedTier) {
      setCategories(CATEGORIES.filter(c => c.tier_slug === selectedTier));
      setSelectedCategory('');
      setSubcategories([]);
      setSelectedSubcategory('');
    } else {
      setCategories([]);
      setSelectedCategory('');
      setSubcategories([]);
      setSelectedSubcategory('');
    }
  }, [selectedTier]);

  useEffect(() => {
    if (selectedCategory) {
      setSubcategories(getSubcategoriesByCategory(selectedCategory));
      setSelectedSubcategory('');
    } else {
      setSubcategories([]);
      setSelectedSubcategory('');
    }
  }, [selectedCategory]);

  const handleStatusToggle = (status: string) => {
    const newStatuses = statuses.includes(status)
      ? statuses.filter(s => s !== status)
      : [...statuses, status];
    setStatuses(newStatuses);
    updateSearchParams({ status: newStatuses.join(',') || null });
  };

  const clearAll = () => {
    router.push('/search');
    setSelectedTier('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedState('');
    setSelectedLga('');
    setStatuses([]);
    setMinRating('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-6">
      <h3 className="font-semibold text-gray-900">Filters</h3>

      {/* Location */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          <MapPin className="h-4 w-4" /> Location
        </h4>
        <select
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value);
            setSelectedLga('');
            updateSearchParams({ state: e.target.value || null, lga: null });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All Nigeria</option>
          {states.map(state => (
            <option key={state.state_id} value={state.state_id}>{state.state_name}</option>
          ))}
        </select>
        {selectedState && (
          <select
            value={selectedLga}
            onChange={(e) => {
              setSelectedLga(e.target.value);
              updateSearchParams({ lga: e.target.value || null });
            }}
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All LGAs</option>
            {lgas.map(lga => (
              <option key={lga.lga_id} value={lga.lga_id}>{lga.lga_name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Service Tier */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Service Tier</h4>
        <select
          value={selectedTier}
          onChange={(e) => {
            setSelectedTier(e.target.value);
            updateSearchParams({
              tier: e.target.value || null,
              category: null,
              subcategory: null,
            });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All Tiers</option>
          {TIERS.map(tier => (
            <option key={tier.slug} value={tier.slug}>{tier.name}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      {selectedTier && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Category</h4>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              updateSearchParams({
                category: e.target.value || null,
                subcategory: null,
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.slug} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Subcategory */}
      {selectedCategory && subcategories.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Subcategory</h4>
          <select
            value={selectedSubcategory}
            onChange={(e) => {
              setSelectedSubcategory(e.target.value);
              updateSearchParams({ subcategory: e.target.value || null });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Subcategories</option>
            {subcategories.map((sub: any) => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Availability */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Availability</h4>
        <div className="space-y-2">
          {['available', 'busy', 'away'].map(status => (
            <label key={status} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={statuses.includes(status)}
                onChange={() => handleStatusToggle(status)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="capitalize">{status}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Minimum Rating</h4>
        <select
          value={minRating}
          onChange={(e) => {
            setMinRating(e.target.value);
            updateSearchParams({ rating: e.target.value || null });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">Any</option>
          <option value="4">4+ Stars</option>
          <option value="3">3+ Stars</option>
        </select>
      </div>

      <button
        onClick={clearAll}
        className="w-full py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
      >
        Clear all filters
      </button>
    </div>
  );
}