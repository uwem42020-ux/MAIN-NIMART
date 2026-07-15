export interface Category {
  id: number
  name: string
  slug: string
  tier_slug: string
}

export interface Tier {
  slug: string
  name: string
  categories: Category[]
}

// This would be populated from database, but for frontend we can have static mapping
export const TIERS: Tier[] = [
  {
    slug: 'automotive',
    name: 'Automotive & Roadside Emergencies',
    categories: [
      { id: 1, name: 'Vehicle Mechanics', slug: 'vehicle-mechanics', tier_slug: 'automotive' },
      { id: 2, name: 'Roadside Emergencies (24/7)', slug: 'roadside-emergencies', tier_slug: 'automotive' },
      // ... add all 14 tiers with their categories
    ]
  },
  // ... all 14 tiers
]

export const SUBCATEGORIES: Record<string, { id: number; name: string }[]> = {
  'vehicle-mechanics': [
    { id: 101, name: 'General Motor Mechanics' },
    { id: 102, name: 'Mercedes-Benz Specialists' },
    // ... all 250+ subcategories
  ]
}