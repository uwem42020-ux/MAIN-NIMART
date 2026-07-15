import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { TIERS, CATEGORIES, SUBCATEGORIES } from '../../data/categories';
import { cn } from '../../lib/utils';

// 用于显示的图标映射（你可以替换为自己的图片 URL）
const tierIconMap: Record<string, string> = {
  automotive: '🚗',
  'home-property': '🏠',
  emergency: '🚨',
  professional: '💼',
  technology: '💻',
  beauty: '💅',
  food: '🍔',
  events: '🎉',
  education: '📚',
  health: '❤️',
  logistics: '🚚',
  social: '👥',
  'business-partners': '🤝',
  trade: '🌍',
};

export function CategoryTree() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 获取当前选中层级的子项
  const currentTier = TIERS.find(t => t.slug === selectedTier);
  const categories = selectedTier
    ? CATEGORIES.filter(c => c.tier_slug === selectedTier)
    : [];
  const subcategories = selectedCategory
    ? SUBCATEGORIES.filter(s => s.category_slug === selectedCategory)
    : [];

  // 当切换一级分类时，清空二三级选中状态
  useEffect(() => {
    setSelectedCategory(null);
  }, [selectedTier]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">All Categories</h3>
      </div>
      <div className="flex h-96">
        {/* 第一列：一级分类（Tiers） */}
        <div className="w-1/3 border-r border-gray-100 overflow-y-auto">
          {TIERS.map(tier => (
            <button
              key={tier.slug}
              onClick={() => setSelectedTier(tier.slug)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors',
                selectedTier === tier.slug && 'bg-primary-50 text-primary-700'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{tierIconMap[tier.slug] || '📦'}</span>
                <span className="text-sm font-medium truncate">{tier.name}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          ))}
        </div>

        {/* 第二列：二级分类（Categories） */}
        <div className="w-1/3 border-r border-gray-100 overflow-y-auto">
          {selectedTier && categories.length > 0 ? (
            categories.map(cat => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors',
                  selectedCategory === cat.slug && 'bg-primary-50 text-primary-700'
                )}
              >
                <span className="text-sm truncate">{cat.name}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-gray-400 text-sm">
              {selectedTier ? 'No subcategories' : 'Select a category'}
            </div>
          )}
        </div>

        {/* 第三列：三级分类（Subcategories） */}
        <div className="w-1/3 overflow-y-auto">
          {selectedCategory && subcategories.length > 0 ? (
            subcategories.map(sub => (
              <Link
                key={sub.id}
                to={`/search?subcategory=${sub.id}`}
                className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
              >
                {sub.name}
              </Link>
            ))
          ) : (
            <div className="p-4 text-center text-gray-400 text-sm">
              {selectedCategory ? 'No further categories' : 'Select a subcategory'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}