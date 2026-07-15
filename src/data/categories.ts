// src/data/categories.ts

export interface Tier {
  slug: string;
  name: string;
}

export interface Category {
  slug: string;
  name: string;
  tier_slug: string;
}

export interface Subcategory {
  id: number;
  name: string;
  category_slug: string;
}

export const TIERS: Tier[] = [
  { slug: 'automotive', name: 'Automotive & Roadside Emergencies' },
  { slug: 'home-property', name: 'Home & Property' },
  { slug: 'emergency', name: 'Emergency & Safety' },
  { slug: 'professional', name: 'Professional Services' },
  { slug: 'technology', name: 'Technology & Digital' },
  { slug: 'beauty', name: 'Personal Care & Beauty' },
  { slug: 'food', name: 'Food & Catering' },
  { slug: 'events', name: 'Events & Celebrations' },
  { slug: 'education', name: 'Education & Learning' },
  { slug: 'health', name: 'Health & Wellness' },
  { slug: 'logistics', name: 'Logistics & Transportation' },
  { slug: 'social', name: 'Social & Community' },
  { slug: 'business-partners', name: 'Business Partners & Support' },
  { slug: 'trade', name: 'Import/Export & Trade' },
];

export const CATEGORIES: Category[] = [
  // Tier: automotive
  { slug: 'vehicle-mechanics', name: 'Vehicle Mechanics', tier_slug: 'automotive' },
  { slug: 'roadside-emergencies', name: 'Roadside Emergencies (24/7)', tier_slug: 'automotive' },
  { slug: 'auto-repair', name: 'Auto Repair Specialists', tier_slug: 'automotive' },
  { slug: 'auto-maintenance', name: 'Auto Maintenance & Services', tier_slug: 'automotive' },
  { slug: 'auto-parts', name: 'Auto Parts & Accessories', tier_slug: 'automotive' },
  { slug: 'commercial-vehicles', name: 'Commercial Vehicles', tier_slug: 'automotive' },
  { slug: 'official-vehicle', name: 'Official Vehicle Services', tier_slug: 'automotive' },
  // Tier: home-property
  { slug: 'plumbing', name: 'Plumbing & Water', tier_slug: 'home-property' },
  { slug: 'electrical', name: 'Electrical Services', tier_slug: 'home-property' },
  { slug: 'construction', name: 'Construction & Structure', tier_slug: 'home-property' },
  { slug: 'carpentry', name: 'Carpentry & Woodwork', tier_slug: 'home-property' },
  { slug: 'painting', name: 'Painting & Decoration', tier_slug: 'home-property' },
  { slug: 'metal-works', name: 'Metal Works & Fabrication', tier_slug: 'home-property' },
  { slug: 'glass', name: 'Glass & Glazing', tier_slug: 'home-property' },
  { slug: 'appliance-repair', name: 'Appliance & Electronics Repair', tier_slug: 'home-property' },
  { slug: 'home-security', name: 'Home Security', tier_slug: 'home-property' },
  { slug: 'cleaning', name: 'Cleaning & Laundry Services', tier_slug: 'home-property' },
  { slug: 'solar-energy', name: 'Solar Energy Services', tier_slug: 'home-property' },
  { slug: 'water-supply', name: 'Water Supply & Delivery', tier_slug: 'home-property' },
  { slug: 'gardening', name: 'Gardening & Landscaping', tier_slug: 'home-property' },
  // Tier: emergency
  { slug: 'medical-emergency', name: 'Medical Emergencies', tier_slug: 'emergency' },
  { slug: 'fire-rescue', name: 'Fire & Rescue', tier_slug: 'emergency' },
  { slug: 'security-guarding', name: 'Security & Guarding', tier_slug: 'emergency' },
  // Tier: professional
  { slug: 'legal', name: 'Legal Services', tier_slug: 'professional' },
  { slug: 'financial', name: 'Financial Services', tier_slug: 'professional' },
  { slug: 'business', name: 'Business Services', tier_slug: 'professional' },
  { slug: 'real-estate', name: 'Real Estate & Property', tier_slug: 'professional' },
  { slug: 'architecture', name: 'Architecture & Engineering', tier_slug: 'professional' },
  { slug: 'pos-agent', name: 'POS & Agency Banking', tier_slug: 'professional' },
  { slug: 'freelance', name: 'Freelance & Gig Work', tier_slug: 'professional' },
  // Tier: technology
  { slug: 'computer-it', name: 'Computer & IT Services', tier_slug: 'technology' },
  { slug: 'mobile-phone', name: 'Mobile Phone Services', tier_slug: 'technology' },
  { slug: 'digital-creative', name: 'Digital & Creative', tier_slug: 'technology' },
  { slug: 'printing', name: 'Printing & Publishing', tier_slug: 'technology' },
  // Tier: beauty
  { slug: 'hair', name: 'Hair Services', tier_slug: 'beauty' },
  { slug: 'makeup', name: 'Makeup & Beauty', tier_slug: 'beauty' },
  { slug: 'nail', name: 'Nail Care', tier_slug: 'beauty' },
  { slug: 'spa', name: 'Spa & Wellness', tier_slug: 'beauty' },
  { slug: 'fashion', name: 'Fashion & Tailoring', tier_slug: 'beauty' },
  // Tier: food
  { slug: 'catering', name: 'Catering Services', tier_slug: 'food' },
  { slug: 'private-chef', name: 'Private Chefs', tier_slug: 'food' },
  { slug: 'food-delivery', name: 'Food Delivery (Home-based)', tier_slug: 'food' },
  { slug: 'drinks', name: 'Drink & Beverage', tier_slug: 'food' },
  { slug: 'professional-food', name: 'Professional Food Services', tier_slug: 'food' },
  // Tier: events
  { slug: 'photography', name: 'Event Photography', tier_slug: 'events' },
  { slug: 'event-planning', name: 'Event Planning & Decor', tier_slug: 'events' },
  { slug: 'entertainment', name: 'Entertainment (Live)', tier_slug: 'events' },
  { slug: 'weddings', name: 'Weddings (Specialized)', tier_slug: 'events' },
  // Tier: education
  { slug: 'tutoring', name: 'Private Tutoring (Home)', tier_slug: 'education' },
  { slug: 'skills', name: 'Skill Acquisition', tier_slug: 'education' },
  { slug: 'music-arts', name: 'Music & Arts', tier_slug: 'education' },
  { slug: 'special-needs', name: 'Special Needs Education', tier_slug: 'education' },
  { slug: 'edu-support', name: 'Educational Support', tier_slug: 'education' },
  // Tier: health
  { slug: 'medical-home', name: 'Medical Professionals (Home Visit)', tier_slug: 'health' },
  { slug: 'alternative-medicine', name: 'Alternative Medicine', tier_slug: 'health' },
  { slug: 'mental-health', name: 'Mental Health', tier_slug: 'health' },
  { slug: 'fitness', name: 'Fitness & Sports', tier_slug: 'health' },
  // Tier: logistics
  { slug: 'moving', name: 'Moving & Relocation', tier_slug: 'logistics' },
  { slug: 'delivery', name: 'Delivery & Courier', tier_slug: 'logistics' },
  { slug: 'rentals', name: 'Rentals (Vehicles/Equipment)', tier_slug: 'logistics' },
  { slug: 'transport', name: 'Transport & Ride Services', tier_slug: 'logistics' },
  // Tier: social
  { slug: 'social-groups', name: 'Social Groups & Meetups', tier_slug: 'social' },
  { slug: 'venues', name: 'Event Spaces & Venues', tier_slug: 'social' },
  // Tier: business-partners
  { slug: 'b2b-partners', name: 'Business Partners (B2B)', tier_slug: 'business-partners' },
  { slug: 'sme-services', name: 'Business Services (SME)', tier_slug: 'business-partners' },
  { slug: 'creative-partners', name: 'Creative Economy Partners', tier_slug: 'business-partners' },
  // Tier: trade
  { slug: 'export', name: 'Export Services', tier_slug: 'trade' },
  { slug: 'import', name: 'Import Services', tier_slug: 'trade' },
  { slug: 'cross-border', name: 'Cross-Border Traders', tier_slug: 'trade' },
  { slug: 'agriculture', name: 'Farming & Agriculture', tier_slug: 'trade' },
];

export const SUBCATEGORIES: Subcategory[] = [
  // ====================== AUTOMOTIVE ======================
  // Vehicle Mechanics (101–115)
  { id: 101, name: 'General Motor Mechanics', category_slug: 'vehicle-mechanics' },
  { id: 102, name: 'Mercedes-Benz Specialists', category_slug: 'vehicle-mechanics' },
  { id: 103, name: 'Toyota/Lexus Specialists', category_slug: 'vehicle-mechanics' },
  { id: 104, name: 'Honda/Acura Specialists', category_slug: 'vehicle-mechanics' },
  { id: 105, name: 'German Cars (BMW/Audi/VW)', category_slug: 'vehicle-mechanics' },
  { id: 106, name: 'Japanese Cars Specialists', category_slug: 'vehicle-mechanics' },
  { id: 107, name: 'Korean Cars (Hyundai/Kia)', category_slug: 'vehicle-mechanics' },
  { id: 108, name: 'Chinese Cars Specialists', category_slug: 'vehicle-mechanics' },
  { id: 109, name: 'Diesel Engine Specialists', category_slug: 'vehicle-mechanics' },
  { id: 110, name: 'Petrol Engine Specialists', category_slug: 'vehicle-mechanics' },
  { id: 111, name: 'Gearbox/Transmission Specialists', category_slug: 'vehicle-mechanics' },
  { id: 112, name: 'Engine Reboring/Grinding', category_slug: 'vehicle-mechanics' },
  { id: 113, name: 'Auto Electrical Diagnostics', category_slug: 'vehicle-mechanics' },
  { id: 114, name: 'Car Computer Diagnostics', category_slug: 'vehicle-mechanics' },
  { id: 115, name: 'Mechanic Villages Specialists', category_slug: 'vehicle-mechanics' },

  // Roadside Emergencies (201–208)
  { id: 201, name: 'Vehicle Towing Services', category_slug: 'roadside-emergencies' },
  { id: 202, name: 'Flatbed/Trailer Services', category_slug: 'roadside-emergencies' },
  { id: 203, name: 'Jump-Start/Battery Rescue', category_slug: 'roadside-emergencies' },
  { id: 204, name: 'Tire Change (Roadside)', category_slug: 'roadside-emergencies' },
  { id: 205, name: 'Fuel Delivery (Emergency)', category_slug: 'roadside-emergencies' },
  { id: 206, name: 'Lockout Services', category_slug: 'roadside-emergencies' },
  { id: 207, name: 'Accident Recovery', category_slug: 'roadside-emergencies' },
  { id: 208, name: 'Vehicle Extrication', category_slug: 'roadside-emergencies' },

  // Auto Repair Specialists (301–313)
  { id: 301, name: 'Auto Air Conditioning (AC) Repair', category_slug: 'auto-repair' },
  { id: 302, name: 'Radiator & Cooling System', category_slug: 'auto-repair' },
  { id: 303, name: 'Brake System Specialists', category_slug: 'auto-repair' },
  { id: 304, name: 'Suspension & Shock Absorbers', category_slug: 'auto-repair' },
  { id: 305, name: 'Steering & Alignment', category_slug: 'auto-repair' },
  { id: 306, name: 'Exhaust & Muffler Repair', category_slug: 'auto-repair' },
  { id: 307, name: 'Auto Paint & Spray Painting', category_slug: 'auto-repair' },
  { id: 308, name: 'Panel Beating & Body Work', category_slug: 'auto-repair' },
  { id: 309, name: 'Dent Removal (Paintless)', category_slug: 'auto-repair' },
  { id: 310, name: 'Car Upholstery & Seat Repair', category_slug: 'auto-repair' },
  { id: 311, name: 'Car Glass/Windscreen Replacement', category_slug: 'auto-repair' },
  { id: 312, name: 'Car Key Programming', category_slug: 'auto-repair' },
  { id: 313, name: 'Car Alarm & Immobilizer', category_slug: 'auto-repair' },

  // Auto Maintenance & Services (401–411)
  { id: 401, name: 'Oil Change & Lubrication', category_slug: 'auto-maintenance' },
  { id: 402, name: 'Car Wash & Detailing', category_slug: 'auto-maintenance' },
  { id: 403, name: 'Car Polishing & Ceramic Coating', category_slug: 'auto-maintenance' },
  { id: 404, name: 'Engine Flush & Tune-Up', category_slug: 'auto-maintenance' },
  { id: 405, name: 'Battery Sales & Installation', category_slug: 'auto-maintenance' },
  { id: 406, name: 'Tire Sales & Rotation', category_slug: 'auto-maintenance' },
  { id: 407, name: 'Wheel Alignment Services', category_slug: 'auto-maintenance' },
  { id: 408, name: 'Car AC Recharge', category_slug: 'auto-maintenance' },
  { id: 409, name: 'Wiper Blade Replacement', category_slug: 'auto-maintenance' },
  { id: 410, name: 'Bulb & Light Replacement', category_slug: 'auto-maintenance' },
  { id: 411, name: 'Pre-travel Vehicle Inspection', category_slug: 'auto-maintenance' },

  // Auto Parts & Accessories (501–509)
  { id: 501, name: 'Original Spare Parts Dealers', category_slug: 'auto-parts' },
  { id: 502, name: 'Tokunbo (Used) Parts Dealers', category_slug: 'auto-parts' },
  { id: 503, name: 'Auto Parts Importers', category_slug: 'auto-parts' },
  { id: 504, name: 'Scrap Yard/Auto Dismantlers', category_slug: 'auto-parts' },
  { id: 505, name: 'Car Audio & Entertainment', category_slug: 'auto-parts' },
  { id: 506, name: 'Car Accessories', category_slug: 'auto-parts' },
  { id: 507, name: 'Car Lighting (LED/HID)', category_slug: 'auto-parts' },
  { id: 508, name: 'Car Batteries Distributors', category_slug: 'auto-parts' },
  { id: 509, name: 'Engine Oil/Lubricant Dealers', category_slug: 'auto-parts' },

  // Commercial Vehicles (601–606)
  { id: 601, name: 'Truck/Trailer Mechanics', category_slug: 'commercial-vehicles' },
  { id: 602, name: 'Bus/Public Transport Mechanics', category_slug: 'commercial-vehicles' },
  { id: 603, name: 'Heavy Duty Equipment Repair', category_slug: 'commercial-vehicles' },
  { id: 604, name: 'Forklift Repair & Maintenance', category_slug: 'commercial-vehicles' },
  { id: 605, name: 'Generator Mechanics', category_slug: 'commercial-vehicles' },
  { id: 606, name: 'Tipper/Truck Services', category_slug: 'commercial-vehicles' },

  // Official Vehicle Services (701–706)
  { id: 701, name: 'FRSC Services', category_slug: 'official-vehicle' },
  { id: 702, name: 'Vehicle Licensing Agents', category_slug: 'official-vehicle' },
  { id: 703, name: 'Drivers License Processing', category_slug: 'official-vehicle' },
  { id: 704, name: 'Vehicle Verification Agents', category_slug: 'official-vehicle' },
  { id: 705, name: 'Customs Clearance Agents', category_slug: 'official-vehicle' },
  { id: 706, name: 'Insurance Assessors (Vehicle)', category_slug: 'official-vehicle' },

  // ====================== HOME & PROPERTY ======================
  // Plumbing & Water (801–813)
  { id: 801, name: 'General Plumbers', category_slug: 'plumbing' },
  { id: 802, name: 'Borehole Drilling & Installation', category_slug: 'plumbing' },
  { id: 803, name: 'Well Digging Services', category_slug: 'plumbing' },
  { id: 804, name: 'Water Heater Installation/Repair', category_slug: 'plumbing' },
  { id: 805, name: 'Toilet/Bathroom Plumbing', category_slug: 'plumbing' },
  { id: 806, name: 'Kitchen Sink Plumbing', category_slug: 'plumbing' },
  { id: 807, name: 'Drain Unclogging', category_slug: 'plumbing' },
  { id: 808, name: 'Sewage Line Repair', category_slug: 'plumbing' },
  { id: 809, name: 'Septic Tank Services', category_slug: 'plumbing' },
  { id: 810, name: 'Water Pump Installation/Repair', category_slug: 'plumbing' },
  { id: 811, name: 'Overhead Tank Installation', category_slug: 'plumbing' },
  { id: 812, name: 'Pipe Leak Detection', category_slug: 'plumbing' },
  { id: 813, name: 'Water Filter Installation', category_slug: 'plumbing' },

  // Electrical Services (901–913)
  { id: 901, name: 'General Electricians', category_slug: 'electrical' },
  { id: 902, name: 'House Wiring (New Build)', category_slug: 'electrical' },
  { id: 903, name: 'House Rewiring (Old)', category_slug: 'electrical' },
  { id: 904, name: 'Lighting Installation', category_slug: 'electrical' },
  { id: 905, name: 'Ceiling Fan Installation', category_slug: 'electrical' },
  { id: 906, name: 'Exhaust Fan Installation', category_slug: 'electrical' },
  { id: 907, name: 'Circuit Breaker/Fuse Box', category_slug: 'electrical' },
  { id: 908, name: 'Inverter Installation', category_slug: 'electrical' },
  { id: 909, name: 'Solar Panel Installation', category_slug: 'electrical' },
  { id: 910, name: 'Generator Wiring (Changeover)', category_slug: 'electrical' },
  { id: 911, name: 'Intercom/Doorbell', category_slug: 'electrical' },
  { id: 912, name: 'Surge Protection', category_slug: 'electrical' },
  { id: 913, name: 'Electrical Safety Inspection', category_slug: 'electrical' },

  // Construction & Structure (1001–1013)
  { id: 1001, name: 'Bricklayers/Masons', category_slug: 'construction' },
  { id: 1002, name: 'Block Molding & Supply', category_slug: 'construction' },
  { id: 1003, name: 'Concrete Work', category_slug: 'construction' },
  { id: 1004, name: 'Plastering/Popping', category_slug: 'construction' },
  { id: 1005, name: 'Tiling & Flooring', category_slug: 'construction' },
  { id: 1006, name: 'POP Ceiling', category_slug: 'construction' },
  { id: 1007, name: 'PVC Ceiling Installation', category_slug: 'construction' },
  { id: 1008, name: 'Roofing Installation', category_slug: 'construction' },
  { id: 1009, name: 'Ceiling Installation', category_slug: 'construction' },
  { id: 1010, name: 'Scaffolding Services', category_slug: 'construction' },
  { id: 1011, name: 'Building Demolition', category_slug: 'construction' },
  { id: 1012, name: 'Site Clearing', category_slug: 'construction' },
  { id: 1013, name: 'Foundation Digging', category_slug: 'construction' },

  // Carpentry & Woodwork (1101–1113)
  { id: 1101, name: 'Furniture Makers (Custom)', category_slug: 'carpentry' },
  { id: 1102, name: 'Wardrobe Installation', category_slug: 'carpentry' },
  { id: 1103, name: 'Kitchen Cabinet Makers', category_slug: 'carpentry' },
  { id: 1104, name: 'Door Installation (Wooden)', category_slug: 'carpentry' },
  { id: 1105, name: 'Window Installation (Wooden)', category_slug: 'carpentry' },
  { id: 1106, name: 'Bed Makers', category_slug: 'carpentry' },
  { id: 1107, name: 'Chair Makers', category_slug: 'carpentry' },
  { id: 1108, name: 'Table Makers', category_slug: 'carpentry' },
  { id: 1109, name: 'Bookshelf Makers', category_slug: 'carpentry' },
  { id: 1110, name: 'Wood Polishing & Finishing', category_slug: 'carpentry' },
  { id: 1111, name: 'Cane/Rattan Furniture', category_slug: 'carpentry' },
  { id: 1112, name: 'Upholstery (Sofa Re-covering)', category_slug: 'carpentry' },
  { id: 1113, name: 'Furniture Repair', category_slug: 'carpentry' },

  // Painting & Decoration (1201–1211)
  { id: 1201, name: 'Interior Painters', category_slug: 'painting' },
  { id: 1202, name: 'Exterior Painters', category_slug: 'painting' },
  { id: 1203, name: 'Wallpaper Installation', category_slug: 'painting' },
  { id: 1204, name: 'Textured Painting', category_slug: 'painting' },
  { id: 1205, name: 'Spray Painting (Furniture)', category_slug: 'painting' },
  { id: 1206, name: 'Painting Estimates', category_slug: 'painting' },
  { id: 1207, name: 'Color Consulting', category_slug: 'painting' },
  { id: 1208, name: 'POP Decoration', category_slug: 'painting' },
  { id: 1209, name: '3D Wall Panels', category_slug: 'painting' },
  { id: 1210, name: 'Fence/Wall Painting', category_slug: 'painting' },
  { id: 1211, name: 'Road/Line Marking', category_slug: 'painting' },

  // Metal Works & Fabrication (1301–1311)
  { id: 1301, name: 'Welders (General)', category_slug: 'metal-works' },
  { id: 1302, name: 'Aluminum Fabricators', category_slug: 'metal-works' },
  { id: 1303, name: 'Stainless Steel Fabricators', category_slug: 'metal-works' },
  { id: 1304, name: 'Iron Benders (Construction)', category_slug: 'metal-works' },
  { id: 1305, name: 'Gate & Railing Fabrication', category_slug: 'metal-works' },
  { id: 1306, name: 'Window/Door Frames (Metal)', category_slug: 'metal-works' },
  { id: 1307, name: 'Burglary Proof Installation', category_slug: 'metal-works' },
  { id: 1308, name: 'Staircase Railings', category_slug: 'metal-works' },
  { id: 1309, name: 'Car Port Fabrication', category_slug: 'metal-works' },
  { id: 1310, name: 'Metal Roofing Installation', category_slug: 'metal-works' },
  { id: 1311, name: 'Welding (Industrial)', category_slug: 'metal-works' },

  // Glass & Glazing (1401–1409)
  { id: 1401, name: 'Glass Suppliers', category_slug: 'glass' },
  { id: 1402, name: 'Glass Cut-to-Size', category_slug: 'glass' },
  { id: 1403, name: 'Window Glass Installation', category_slug: 'glass' },
  { id: 1404, name: 'Sliding Door Installation', category_slug: 'glass' },
  { id: 1405, name: 'Shower Cubicle Glass', category_slug: 'glass' },
  { id: 1406, name: 'Mirror Installation', category_slug: 'glass' },
  { id: 1407, name: 'Glass Tabletops', category_slug: 'glass' },
  { id: 1408, name: 'Auto Glass Repair', category_slug: 'glass' },
  { id: 1409, name: 'Glass Balustrade', category_slug: 'glass' },

  // Appliance & Electronics Repair (1501–1515)
  { id: 1501, name: 'Refrigerator Repair', category_slug: 'appliance-repair' },
  { id: 1502, name: 'Freezer Repair', category_slug: 'appliance-repair' },
  { id: 1503, name: 'Air Conditioner Repair', category_slug: 'appliance-repair' },
  { id: 1504, name: 'AC Gas Refill', category_slug: 'appliance-repair' },
  { id: 1505, name: 'Washing Machine Repair', category_slug: 'appliance-repair' },
  { id: 1506, name: 'Dishwasher Repair', category_slug: 'appliance-repair' },
  { id: 1507, name: 'Gas Cooker/Stove Repair', category_slug: 'appliance-repair' },
  { id: 1508, name: 'Electric Oven Repair', category_slug: 'appliance-repair' },
  { id: 1509, name: 'Microwave Repair', category_slug: 'appliance-repair' },
  { id: 1510, name: 'Television Repair', category_slug: 'appliance-repair' },
  { id: 1511, name: 'Home Theater Repair', category_slug: 'appliance-repair' },
  { id: 1512, name: 'Generator Repair', category_slug: 'appliance-repair' },
  { id: 1513, name: 'Inverter Repair', category_slug: 'appliance-repair' },
  { id: 1514, name: 'Iron/Kettle Repair', category_slug: 'appliance-repair' },
  { id: 1515, name: 'Vacuum Cleaner Repair', category_slug: 'appliance-repair' },

  // Home Security (1601–1610)
  { id: 1601, name: 'Burglary Proof Fabrication', category_slug: 'home-security' },
  { id: 1602, name: 'Security Door Installation', category_slug: 'home-security' },
  { id: 1603, name: 'CCTV Camera Installation', category_slug: 'home-security' },
  { id: 1604, name: 'Intercom System', category_slug: 'home-security' },
  { id: 1605, name: 'Electric Fence', category_slug: 'home-security' },
  { id: 1606, name: 'Security Gate Automation', category_slug: 'home-security' },
  { id: 1607, name: 'Security Lighting', category_slug: 'home-security' },
  { id: 1608, name: 'Safe/Vault Installation', category_slug: 'home-security' },
  { id: 1609, name: 'Lock Repair & Replacement', category_slug: 'home-security' },
  { id: 1610, name: 'Locksmith Services', category_slug: 'home-security' },

  // ===== NEW: Cleaning & Laundry Services (1611–1624) =====
  { id: 1611, name: 'House Cleaning', category_slug: 'cleaning' },
  { id: 1612, name: 'Office Cleaning', category_slug: 'cleaning' },
  { id: 1613, name: 'Post-Construction Cleaning', category_slug: 'cleaning' },
  { id: 1614, name: 'Fumigation & Pest Control', category_slug: 'cleaning' },
  { id: 1615, name: 'Laundry & Dry Cleaning', category_slug: 'cleaning' },
  { id: 1616, name: 'Carpet & Upholstery Cleaning', category_slug: 'cleaning' },
  { id: 1617, name: 'Window & Glass Cleaning', category_slug: 'cleaning' },
  { id: 1618, name: 'Shoe Cleaning & Repair', category_slug: 'cleaning' },
  { id: 1619, name: 'Domestic Help / Housekeeping', category_slug: 'cleaning' },
  { id: 1620, name: 'Event Cleanup', category_slug: 'cleaning' },
  { id: 1621, name: 'Graffiti Removal', category_slug: 'cleaning' },
  { id: 1622, name: 'Tank Cleaning', category_slug: 'cleaning' },
  { id: 1623, name: 'Industrial Cleaning', category_slug: 'cleaning' },
  { id: 1624, name: 'Mattress Cleaning', category_slug: 'cleaning' },

  // ===== NEW: Solar Energy Services (1625–1636) =====
  { id: 1625, name: 'Solar Panel Installation', category_slug: 'solar-energy' },
  { id: 1626, name: 'Solar Inverter Installation', category_slug: 'solar-energy' },
  { id: 1627, name: 'Solar Battery Supply', category_slug: 'solar-energy' },
  { id: 1628, name: 'Solar Street Light Installation', category_slug: 'solar-energy' },
  { id: 1629, name: 'Solar Water Heater', category_slug: 'solar-energy' },
  { id: 1630, name: 'Solar System Maintenance', category_slug: 'solar-energy' },
  { id: 1631, name: 'Solar Consultation', category_slug: 'solar-energy' },
  { id: 1632, name: 'Mini-Grid Installation', category_slug: 'solar-energy' },
  { id: 1633, name: 'Solar Borehole Pump', category_slug: 'solar-energy' },
  { id: 1634, name: 'Inverter Repair', category_slug: 'solar-energy' },
  { id: 1635, name: 'Charge Controller Repair', category_slug: 'solar-energy' },
  { id: 1636, name: 'Solar Panel Cleaning', category_slug: 'solar-energy' },

  // ===== NEW: Water Supply & Delivery (1637–1646) =====
  { id: 1637, name: 'Water Tanker Delivery', category_slug: 'water-supply' },
  { id: 1638, name: 'Pure Water Production', category_slug: 'water-supply' },
  { id: 1639, name: 'Sachet Water Supply', category_slug: 'water-supply' },
  { id: 1640, name: 'Bottled Water Delivery', category_slug: 'water-supply' },
  { id: 1641, name: 'Dispenser Water Supply', category_slug: 'water-supply' },
  { id: 1642, name: 'Water Treatment Services', category_slug: 'water-supply' },
  { id: 1643, name: 'Water Storage Tank Installation', category_slug: 'water-supply' },
  { id: 1644, name: 'Rainwater Harvesting', category_slug: 'water-supply' },
  { id: 1645, name: 'Water Quality Testing', category_slug: 'water-supply' },
  { id: 1646, name: 'Borehole Maintenance', category_slug: 'water-supply' },

  // ===== NEW: Gardening & Landscaping (1647–1656) =====
  { id: 1647, name: 'Garden Maintenance', category_slug: 'gardening' },
  { id: 1648, name: 'Lawn Mowing & Care', category_slug: 'gardening' },
  { id: 1649, name: 'Flower Planting & Arrangement', category_slug: 'gardening' },
  { id: 1650, name: 'Tree Pruning & Removal', category_slug: 'gardening' },
  { id: 1651, name: 'Landscaping Design', category_slug: 'gardening' },
  { id: 1652, name: 'Hedge Trimming', category_slug: 'gardening' },
  { id: 1653, name: 'Artificial Grass Installation', category_slug: 'gardening' },
  { id: 1654, name: 'Outdoor Decking', category_slug: 'gardening' },
  { id: 1655, name: 'Water Fountain Installation', category_slug: 'gardening' },
  { id: 1656, name: 'Swimming Pool Cleaning', category_slug: 'gardening' },

  // ====================== EMERGENCY ======================
  // Medical Emergencies (1701–1706)
  { id: 1701, name: 'Ambulance Services', category_slug: 'medical-emergency' },
  { id: 1702, name: 'Emergency Medical Response', category_slug: 'medical-emergency' },
  { id: 1703, name: 'First Aid at Home', category_slug: 'medical-emergency' },
  { id: 1704, name: 'Poison Control', category_slug: 'medical-emergency' },
  { id: 1705, name: 'Emergency Childbirth Assistance', category_slug: 'medical-emergency' },
  { id: 1706, name: 'Medical Evacuation', category_slug: 'medical-emergency' },

  // Fire & Rescue (1801–1806)
  { id: 1801, name: 'Fire Emergency Response', category_slug: 'fire-rescue' },
  { id: 1802, name: 'Fire Extinguisher Sales/Service', category_slug: 'fire-rescue' },
  { id: 1803, name: 'Fire Safety Training', category_slug: 'fire-rescue' },
  { id: 1804, name: 'Smoke Detector Installation', category_slug: 'fire-rescue' },
  { id: 1805, name: 'Fire Hydrant Maintenance', category_slug: 'fire-rescue' },
  { id: 1806, name: 'Rescue from Heights/Confined Spaces', category_slug: 'fire-rescue' },

  // Security & Guarding (1901–1906)
  { id: 1901, name: 'Private Security Guards', category_slug: 'security-guarding' },
  { id: 1902, name: 'Event Security', category_slug: 'security-guarding' },
  { id: 1903, name: 'Residential Security Patrol', category_slug: 'security-guarding' },
  { id: 1904, name: 'Corporate Security', category_slug: 'security-guarding' },
  { id: 1905, name: 'Bodyguard Services', category_slug: 'security-guarding' },
  { id: 1906, name: 'Security Consultation', category_slug: 'security-guarding' },

  // ====================== PROFESSIONAL ======================
  // Legal Services (2001–2007)
  { id: 2001, name: 'Lawyers (General Practice)', category_slug: 'legal' },
  { id: 2002, name: 'Property/Real Estate Lawyers', category_slug: 'legal' },
  { id: 2003, name: 'Family/Divorce Lawyers', category_slug: 'legal' },
  { id: 2004, name: 'Corporate/Commercial Lawyers', category_slug: 'legal' },
  { id: 2005, name: 'Criminal Defense Lawyers', category_slug: 'legal' },
  { id: 2006, name: 'Notary Public Services', category_slug: 'legal' },
  { id: 2007, name: 'Legal Document Preparation', category_slug: 'legal' },

  // Financial Services (2101–2108)
  { id: 2101, name: 'Accountants', category_slug: 'financial' },
  { id: 2102, name: 'Tax Preparation & Filing', category_slug: 'financial' },
  { id: 2103, name: 'Auditors', category_slug: 'financial' },
  { id: 2104, name: 'Financial Advisors', category_slug: 'financial' },
  { id: 2105, name: 'Bookkeeping Services', category_slug: 'financial' },
  { id: 2106, name: 'Payroll Services', category_slug: 'financial' },
  { id: 2107, name: 'Insurance Brokers', category_slug: 'financial' },
  { id: 2108, name: 'Investment Consultants', category_slug: 'financial' },

  // Business Services (2201–2208)
  { id: 2201, name: 'Business Registration (CAC)', category_slug: 'business' },
  { id: 2202, name: 'Business Plan Writing', category_slug: 'business' },
  { id: 2203, name: 'Company Secretarial Services', category_slug: 'business' },
  { id: 2204, name: 'HR & Recruitment', category_slug: 'business' },
  { id: 2205, name: 'Marketing & Advertising', category_slug: 'business' },
  { id: 2206, name: 'Branding & Strategy', category_slug: 'business' },
  { id: 2207, name: 'Business Coaching', category_slug: 'business' },
  { id: 2208, name: 'Office Administration', category_slug: 'business' },

  // Real Estate & Property (2301–2308)
  { id: 2301, name: 'Real Estate Agents', category_slug: 'real-estate' },
  { id: 2302, name: 'Property Valuation', category_slug: 'real-estate' },
  { id: 2303, name: 'Property Management', category_slug: 'real-estate' },
  { id: 2304, name: 'Lettings & Leasing', category_slug: 'real-estate' },
  { id: 2305, name: 'Land Surveyors', category_slug: 'real-estate' },
  { id: 2306, name: 'Estate Developers', category_slug: 'real-estate' },
  { id: 2307, name: 'Facility Management', category_slug: 'real-estate' },
  { id: 2308, name: 'Property Legal Services', category_slug: 'real-estate' },

  // Architecture & Engineering (2401–2408)
  { id: 2401, name: 'Architects', category_slug: 'architecture' },
  { id: 2402, name: 'Structural Engineers', category_slug: 'architecture' },
  { id: 2403, name: 'Civil Engineers', category_slug: 'architecture' },
  { id: 2404, name: 'Mechanical Engineers', category_slug: 'architecture' },
  { id: 2405, name: 'Electrical Engineers', category_slug: 'architecture' },
  { id: 2406, name: 'Quantity Surveyors', category_slug: 'architecture' },
  { id: 2407, name: 'Building Plan Approval', category_slug: 'architecture' },
  { id: 2408, name: 'Interior Designers', category_slug: 'architecture' },

  // ===== NEW: POS & Agency Banking (2409–2418) =====
  { id: 2409, name: 'POS Agent / Cash Withdrawal', category_slug: 'pos-agent' },
  { id: 2410, name: 'Bill Payment Agent', category_slug: 'pos-agent' },
  { id: 2411, name: 'Mobile Money Agent', category_slug: 'pos-agent' },
  { id: 2412, name: 'BVN Enrollment', category_slug: 'pos-agent' },
  { id: 2413, name: 'NIN Registration', category_slug: 'pos-agent' },
  { id: 2414, name: 'Utility Bill Payment', category_slug: 'pos-agent' },
  { id: 2415, name: 'Airtime/Data Sales', category_slug: 'pos-agent' },
  { id: 2416, name: 'Betting Agent', category_slug: 'pos-agent' },
  { id: 2417, name: 'Bank Account Opening Agent', category_slug: 'pos-agent' },
  { id: 2418, name: 'Remittance & Payout Agent', category_slug: 'pos-agent' },

  // ===== NEW: Freelance & Gig Work (2419–2428) =====
  { id: 2419, name: 'Errand Runner', category_slug: 'freelance' },
  { id: 2420, name: 'Queue/Line Standing', category_slug: 'freelance' },
  { id: 2421, name: 'Document Delivery', category_slug: 'freelance' },
  { id: 2422, name: 'Personal Assistant', category_slug: 'freelance' },
  { id: 2423, name: 'Market Shopper', category_slug: 'freelance' },
  { id: 2424, name: 'Proofreading & Editing', category_slug: 'freelance' },
  { id: 2425, name: 'Data Entry', category_slug: 'freelance' },
  { id: 2426, name: 'Online Tutoring', category_slug: 'freelance' },
  { id: 2427, name: 'Task Outsourcing', category_slug: 'freelance' },
  { id: 2428, name: 'Translation Services', category_slug: 'freelance' },

  // ====================== TECHNOLOGY ======================
  // Computer & IT Services (2501–2508)
  { id: 2501, name: 'Computer Repair (Hardware)', category_slug: 'computer-it' },
  { id: 2502, name: 'Software Installation/Troubleshooting', category_slug: 'computer-it' },
  { id: 2503, name: 'Virus/Malware Removal', category_slug: 'computer-it' },
  { id: 2504, name: 'Data Recovery', category_slug: 'computer-it' },
  { id: 2505, name: 'Networking (LAN/Wi-Fi)', category_slug: 'computer-it' },
  { id: 2506, name: 'IT Support for Businesses', category_slug: 'computer-it' },
  { id: 2507, name: 'Web Development', category_slug: 'computer-it' },
  { id: 2508, name: 'Cybersecurity Services', category_slug: 'computer-it' },

  // Mobile Phone Services (2601–2608)
  { id: 2601, name: 'Phone Screen Replacement', category_slug: 'mobile-phone' },
  { id: 2602, name: 'Battery Replacement', category_slug: 'mobile-phone' },
  { id: 2603, name: 'Charging Port Repair', category_slug: 'mobile-phone' },
  { id: 2604, name: 'Software Unlock/Flashing', category_slug: 'mobile-phone' },
  { id: 2605, name: 'iCloud/FRP Unlock', category_slug: 'mobile-phone' },
  { id: 2606, name: 'Phone Unlocking (Network)', category_slug: 'mobile-phone' },
  { id: 2607, name: 'Tablet Repair', category_slug: 'mobile-phone' },
  { id: 2608, name: 'Phone Accessories Sales', category_slug: 'mobile-phone' },

  // Digital & Creative (2701–2708)
  { id: 2701, name: 'Graphic Design', category_slug: 'digital-creative' },
  { id: 2702, name: 'Logo & Brand Identity', category_slug: 'digital-creative' },
  { id: 2703, name: 'Social Media Management', category_slug: 'digital-creative' },
  { id: 2704, name: 'Content Writing', category_slug: 'digital-creative' },
  { id: 2705, name: 'Video Editing', category_slug: 'digital-creative' },
  { id: 2706, name: 'Animation & Motion Graphics', category_slug: 'digital-creative' },
  { id: 2707, name: 'UI/UX Design', category_slug: 'digital-creative' },
  { id: 2708, name: 'Digital Marketing', category_slug: 'digital-creative' },

  // Printing & Publishing (2801–2808)
  { id: 2801, name: 'Business Card Printing', category_slug: 'printing' },
  { id: 2802, name: 'Flyer & Poster Printing', category_slug: 'printing' },
  { id: 2803, name: 'Banner & Signage', category_slug: 'printing' },
  { id: 2804, name: 'Custom T-Shirt Printing', category_slug: 'printing' },
  { id: 2805, name: 'Booklet & Brochure Printing', category_slug: 'printing' },
  { id: 2806, name: 'Large Format Printing', category_slug: 'printing' },
  { id: 2807, name: 'Souvenir & Mug Printing', category_slug: 'printing' },
  { id: 2808, name: 'Self-Publishing Assistance', category_slug: 'printing' },

  // ====================== BEAUTY ======================
  // Hair Services (2901–2908)
  { id: 2901, name: 'Barber (Men\'s Haircut)', category_slug: 'hair' },
  { id: 2902, name: 'Hairstylist (Women\'s)', category_slug: 'hair' },
  { id: 2903, name: 'Braiding & Weaving', category_slug: 'hair' },
  { id: 2904, name: 'Dreadlocks & Natural Hair', category_slug: 'hair' },
  { id: 2905, name: 'Hair Coloring/Highlighting', category_slug: 'hair' },
  { id: 2906, name: 'Wig Making & Styling', category_slug: 'hair' },
  { id: 2907, name: 'Hair Treatment (Protein, etc.)', category_slug: 'hair' },
  { id: 2908, name: 'Kids Haircuts', category_slug: 'hair' },

  // Makeup & Beauty (3001–3008)
  { id: 3001, name: 'Makeup Artist (Bridal)', category_slug: 'makeup' },
  { id: 3002, name: 'Makeup Artist (Editorial/Fashion)', category_slug: 'makeup' },
  { id: 3003, name: 'Gele Tying', category_slug: 'makeup' },
  { id: 3004, name: 'Eyelash Extensions', category_slug: 'makeup' },
  { id: 3005, name: 'Eyebrow Shaping/Microblading', category_slug: 'makeup' },
  { id: 3006, name: 'Makeup Lessons', category_slug: 'makeup' },
  { id: 3007, name: 'Henna/Body Art', category_slug: 'makeup' },
  { id: 3008, name: 'Permanent Makeup', category_slug: 'makeup' },

  // Nail Care (3101–3108)
  { id: 3101, name: 'Manicure', category_slug: 'nail' },
  { id: 3102, name: 'Pedicure', category_slug: 'nail' },
  { id: 3103, name: 'Acrylic Nails', category_slug: 'nail' },
  { id: 3104, name: 'Gel Nails', category_slug: 'nail' },
  { id: 3105, name: 'Nail Art/Design', category_slug: 'nail' },
  { id: 3106, name: 'Nail Repair', category_slug: 'nail' },
  { id: 3107, name: 'Foot Spa', category_slug: 'nail' },
  { id: 3108, name: 'Ingrown Toenail Treatment', category_slug: 'nail' },

  // Spa & Wellness (3201–3208)
  { id: 3201, name: 'Massage Therapy', category_slug: 'spa' },
  { id: 3202, name: 'Facials & Skin Care', category_slug: 'spa' },
  { id: 3203, name: 'Body Scrubs & Wraps', category_slug: 'spa' },
  { id: 3204, name: 'Waxing/Hair Removal', category_slug: 'spa' },
  { id: 3205, name: 'Aromatherapy', category_slug: 'spa' },
  { id: 3206, name: 'Sauna/Steam Room', category_slug: 'spa' },
  { id: 3207, name: 'Weight Loss Programs', category_slug: 'spa' },
  { id: 3208, name: 'Detox Programs', category_slug: 'spa' },

  // Fashion & Tailoring (3301–3308)
  { id: 3301, name: 'Tailor (Men\'s Wear)', category_slug: 'fashion' },
  { id: 3302, name: 'Fashion Designer (Women\'s)', category_slug: 'fashion' },
  { id: 3303, name: 'Traditional Attire (Agbada, Iro & Buba)', category_slug: 'fashion' },
  { id: 3304, name: 'Bridal Wear Design', category_slug: 'fashion' },
  { id: 3305, name: 'Alterations & Repairs', category_slug: 'fashion' },
  { id: 3306, name: 'Shoemaking/Cobbling', category_slug: 'fashion' },
  { id: 3307, name: 'Bag & Accessory Making', category_slug: 'fashion' },
  { id: 3308, name: 'Beading & Embellishment', category_slug: 'fashion' },

  // ====================== FOOD ======================
  // Catering Services (3401–3408)
  { id: 3401, name: 'Wedding Catering', category_slug: 'catering' },
  { id: 3402, name: 'Corporate Event Catering', category_slug: 'catering' },
  { id: 3403, name: 'Party Catering (Birthdays, etc.)', category_slug: 'catering' },
  { id: 3404, name: 'Small Chop/Vending', category_slug: 'catering' },
  { id: 3405, name: 'Outdoor Catering Setup', category_slug: 'catering' },
  { id: 3406, name: 'Buffet Services', category_slug: 'catering' },
  { id: 3407, name: 'Table & Chair Rental (with Catering)', category_slug: 'catering' },
  { id: 3408, name: 'Food Display & Presentation', category_slug: 'catering' },

  // Private Chefs (3501–3507)
  { id: 3501, name: 'Private Chef (Daily Meals)', category_slug: 'private-chef' },
  { id: 3502, name: 'Private Chef (Special Occasions)', category_slug: 'private-chef' },
  { id: 3503, name: 'Personal Diet Chef', category_slug: 'private-chef' },
  { id: 3504, name: 'Chef for House Parties', category_slug: 'private-chef' },
  { id: 3505, name: 'Continental Cuisine Chef', category_slug: 'private-chef' },
  { id: 3506, name: 'Nigerian Local Dishes Chef', category_slug: 'private-chef' },
  { id: 3507, name: 'Pastry Chef (Desserts)', category_slug: 'private-chef' },

  // Food Delivery (Home-based) (3601–3608)
  { id: 3601, name: 'Home-Cooked Meal Delivery', category_slug: 'food-delivery' },
  { id: 3602, name: 'Restaurant Food Delivery', category_slug: 'food-delivery' },
  { id: 3603, name: 'Bulk Food Delivery (Office/Events)', category_slug: 'food-delivery' },
  { id: 3604, name: 'Special Diet Meal Delivery', category_slug: 'food-delivery' },
  { id: 3605, name: 'Snacks & Small Chops Delivery', category_slug: 'food-delivery' },
  { id: 3606, name: 'Fruits & Veggies Delivery', category_slug: 'food-delivery' },
  { id: 3607, name: 'Soup & Stew Delivery', category_slug: 'food-delivery' },
  { id: 3608, name: 'Lunch Pack Delivery', category_slug: 'food-delivery' },

  // Drink & Beverage (3701–3707)
  { id: 3701, name: 'Alcoholic Drinks Supplier', category_slug: 'drinks' },
  { id: 3702, name: 'Soft Drinks Supplier', category_slug: 'drinks' },
  { id: 3703, name: 'Fresh Juice Vendor', category_slug: 'drinks' },
  { id: 3704, name: 'Smoothie Bar (Mobile)', category_slug: 'drinks' },
  { id: 3705, name: 'Zobo/Kunu/Zobo Drink Makers', category_slug: 'drinks' },
  { id: 3706, name: 'Cocktail/Mocktail Mixologist', category_slug: 'drinks' },
  { id: 3707, name: 'Water Supply (Dispenser)', category_slug: 'drinks' },

  // Professional Food Services (3801–3807)
  { id: 3801, name: 'Food Safety Consultant', category_slug: 'professional-food' },
  { id: 3802, name: 'Menu Development', category_slug: 'professional-food' },
  { id: 3803, name: 'Kitchen Equipment Supplier', category_slug: 'professional-food' },
  { id: 3804, name: 'Food Photography', category_slug: 'professional-food' },
  { id: 3805, name: 'Restaurant Consultant', category_slug: 'professional-food' },
  { id: 3806, name: 'Baking/Pastry Classes', category_slug: 'professional-food' },
  { id: 3807, name: 'Cooking Classes', category_slug: 'professional-food' },

  // ====================== EVENTS ======================
  // Event Photography (3901–3908)
  { id: 3901, name: 'Wedding Photography', category_slug: 'photography' },
  { id: 3902, name: 'Birthday/Party Photography', category_slug: 'photography' },
  { id: 3903, name: 'Corporate Event Photography', category_slug: 'photography' },
  { id: 3904, name: 'Photo Booth Rental', category_slug: 'photography' },
  { id: 3905, name: 'Portrait Photography', category_slug: 'photography' },
  { id: 3906, name: 'Product Photography', category_slug: 'photography' },
  { id: 3907, name: 'Videography', category_slug: 'photography' },
  { id: 3908, name: 'Drone Photography/Videography', category_slug: 'photography' },

  // Event Planning & Decor (4001–4008)
  { id: 4001, name: 'Wedding Planner', category_slug: 'event-planning' },
  { id: 4002, name: 'Birthday Party Planner', category_slug: 'event-planning' },
  { id: 4003, name: 'Corporate Event Planner', category_slug: 'event-planning' },
  { id: 4004, name: 'Event Decorator (Flowers, Fabrics)', category_slug: 'event-planning' },
  { id: 4005, name: 'Balloon Decoration', category_slug: 'event-planning' },
  { id: 4006, name: 'Event Ushering Services', category_slug: 'event-planning' },
  { id: 4007, name: 'Protocol Officers', category_slug: 'event-planning' },
  { id: 4008, name: 'Event Staffing', category_slug: 'event-planning' },

  // Entertainment (Live) (4101–4108)
  { id: 4101, name: 'DJ Services', category_slug: 'entertainment' },
  { id: 4102, name: 'Live Band', category_slug: 'entertainment' },
  { id: 4103, name: 'MC/Comedian', category_slug: 'entertainment' },
  { id: 4104, name: 'Dancers/Troupes', category_slug: 'entertainment' },
  { id: 4105, name: 'Magician', category_slug: 'entertainment' },
  { id: 4106, name: 'Caricature Artist', category_slug: 'entertainment' },
  { id: 4107, name: 'Sound & PA System Rental', category_slug: 'entertainment' },
  { id: 4108, name: 'Karaoke Setup', category_slug: 'entertainment' },

  // Weddings (Specialized) (4201–4208)
  { id: 4201, name: 'Bridal Stylist', category_slug: 'weddings' },
  { id: 4202, name: 'Wedding Cake Design', category_slug: 'weddings' },
  { id: 4203, name: 'Alaga/Ijoko (Traditional Wedding MC)', category_slug: 'weddings' },
  { id: 4204, name: 'Wedding Invitation Design', category_slug: 'weddings' },
  { id: 4205, name: 'Wedding Favor Vendors', category_slug: 'weddings' },
  { id: 4206, name: 'Wedding Transportation (Limousine)', category_slug: 'weddings' },
  { id: 4207, name: 'Honeymoon Planning', category_slug: 'weddings' },
  { id: 4208, name: 'Wedding Registry Service', category_slug: 'weddings' },

  // ====================== EDUCATION ======================
  // Private Tutoring (Home) (4301–4308)
  { id: 4301, name: 'Maths Tutor', category_slug: 'tutoring' },
  { id: 4302, name: 'English Tutor', category_slug: 'tutoring' },
  { id: 4303, name: 'Science Tutor (Physics, Chem, Bio)', category_slug: 'tutoring' },
  { id: 4304, name: 'French Language Tutor', category_slug: 'tutoring' },
  { id: 4305, name: 'Coding/Computer Tutor', category_slug: 'tutoring' },
  { id: 4306, name: 'Exam Prep (JAMB, WAEC, SAT)', category_slug: 'tutoring' },
  { id: 4307, name: 'Primary School Tutor', category_slug: 'tutoring' },
  { id: 4308, name: 'Special Needs Tutor', category_slug: 'tutoring' },

  // Skill Acquisition (4401–4408)
  { id: 4401, name: 'Fashion Design School', category_slug: 'skills' },
  { id: 4402, name: 'Makeup/Gele Training', category_slug: 'skills' },
  { id: 4403, name: 'Hair/Barbing School', category_slug: 'skills' },
  { id: 4404, name: 'Baking & Pastry Classes', category_slug: 'skills' },
  { id: 4405, name: 'Catering/Cooking School', category_slug: 'skills' },
  { id: 4406, name: 'Photography/Videography Training', category_slug: 'skills' },
  { id: 4407, name: 'Computer/IT Training', category_slug: 'skills' },
  { id: 4408, name: 'Craft & Bead Making', category_slug: 'skills' },

  // Music & Arts (4501–4508)
  { id: 4501, name: 'Piano Teacher', category_slug: 'music-arts' },
  { id: 4502, name: 'Guitar Teacher', category_slug: 'music-arts' },
  { id: 4503, name: 'Violin Teacher', category_slug: 'music-arts' },
  { id: 4504, name: 'Voice/Singing Coach', category_slug: 'music-arts' },
  { id: 4505, name: 'Dance Instructor', category_slug: 'music-arts' },
  { id: 4506, name: 'Fine Art/Painting Teacher', category_slug: 'music-arts' },
  { id: 4507, name: 'Drama/Acting Coach', category_slug: 'music-arts' },
  { id: 4508, name: 'Music Production Training', category_slug: 'music-arts' },

  // Special Needs Education (4601–4606)
  { id: 4601, name: 'Autism Support Tutor', category_slug: 'special-needs' },
  { id: 4602, name: 'Dyslexia Support Tutor', category_slug: 'special-needs' },
  { id: 4603, name: 'Speech Therapy', category_slug: 'special-needs' },
  { id: 4604, name: 'Occupational Therapy', category_slug: 'special-needs' },
  { id: 4605, name: 'Special Needs Assistant', category_slug: 'special-needs' },
  { id: 4606, name: 'Inclusive Education Consultant', category_slug: 'special-needs' },

  // Educational Support (4701–4708)
  { id: 4701, name: 'School Placement Consultant', category_slug: 'edu-support' },
  { id: 4702, name: 'Study Abroad Advisor', category_slug: 'edu-support' },
  { id: 4703, name: 'Educational Psychologist', category_slug: 'edu-support' },
  { id: 4704, name: 'Career Counselling', category_slug: 'edu-support' },
  { id: 4705, name: 'Library Services', category_slug: 'edu-support' },
  { id: 4706, name: 'Research Assistance', category_slug: 'edu-support' },
  { id: 4707, name: 'Educational Materials Supply', category_slug: 'edu-support' },
  { id: 4708, name: 'Scholarship Application Help', category_slug: 'edu-support' },

  // ====================== HEALTH ======================
  // Medical Professionals (Home Visit) (4801–4808)
  { id: 4801, name: 'Doctor Home Visit', category_slug: 'medical-home' },
  { id: 4802, name: 'Nurse Home Care', category_slug: 'medical-home' },
  { id: 4803, name: 'Physiotherapist Home Visit', category_slug: 'medical-home' },
  { id: 4804, name: 'Lab Sample Collection at Home', category_slug: 'medical-home' },
  { id: 4805, name: 'Elderly Care at Home', category_slug: 'medical-home' },
  { id: 4806, name: 'Post-Surgery Care at Home', category_slug: 'medical-home' },
  { id: 4807, name: 'Palliative Care', category_slug: 'medical-home' },
  { id: 4808, name: 'Midwife Home Visit', category_slug: 'medical-home' },

  // Alternative Medicine (4901–4908)
  { id: 4901, name: 'Herbalist (Agbo)', category_slug: 'alternative-medicine' },
  { id: 4902, name: 'Acupuncture', category_slug: 'alternative-medicine' },
  { id: 4903, name: 'Chiropractor', category_slug: 'alternative-medicine' },
  { id: 4904, name: 'Naturopath', category_slug: 'alternative-medicine' },
  { id: 4905, name: 'Traditional Bone Setters', category_slug: 'alternative-medicine' },
  { id: 4906, name: 'Homeopathy', category_slug: 'alternative-medicine' },
  { id: 4907, name: 'Reflexology', category_slug: 'alternative-medicine' },
  { id: 4908, name: 'Ayurveda', category_slug: 'alternative-medicine' },

  // Mental Health (5001–5008)
  { id: 5001, name: 'Psychologist', category_slug: 'mental-health' },
  { id: 5002, name: 'Psychiatrist', category_slug: 'mental-health' },
  { id: 5003, name: 'Counsellor/Therapist', category_slug: 'mental-health' },
  { id: 5004, name: 'Marriage Counselling', category_slug: 'mental-health' },
  { id: 5005, name: 'Addiction Counselling', category_slug: 'mental-health' },
  { id: 5006, name: 'Stress Management', category_slug: 'mental-health' },
  { id: 5007, name: 'Child & Adolescent Therapy', category_slug: 'mental-health' },
  { id: 5008, name: 'Online Therapy', category_slug: 'mental-health' },

  // Fitness & Sports (5101–5108)
  { id: 5101, name: 'Personal Trainer', category_slug: 'fitness' },
  { id: 5102, name: 'Yoga Instructor', category_slug: 'fitness' },
  { id: 5103, name: 'Pilates Instructor', category_slug: 'fitness' },
  { id: 5104, name: 'Aerobics Instructor', category_slug: 'fitness' },
  { id: 5105, name: 'Zumba Instructor', category_slug: 'fitness' },
  { id: 5106, name: 'Sports Coach (Football, Basketball)', category_slug: 'fitness' },
  { id: 5107, name: 'Nutritionist/Dietitian', category_slug: 'fitness' },
  { id: 5108, name: 'Gym Equipment Rental', category_slug: 'fitness' },

  // ====================== LOGISTICS ======================
  // Moving & Relocation (5201–5208)
  { id: 5201, name: 'House Moving (Local)', category_slug: 'moving' },
  { id: 5202, name: 'Interstate Relocation', category_slug: 'moving' },
  { id: 5203, name: 'Office Relocation', category_slug: 'moving' },
  { id: 5204, name: 'Packing Services', category_slug: 'moving' },
  { id: 5205, name: 'Heavy Item Moving (Piano, Safe)', category_slug: 'moving' },
  { id: 5206, name: 'Truck Rental with Driver', category_slug: 'moving' },
  { id: 5207, name: 'International Relocation Services', category_slug: 'moving' },
  { id: 5208, name: 'Storage Services', category_slug: 'moving' },

  // Delivery & Courier (5301–5308)
  { id: 5301, name: 'Same-Day Delivery (Intra-city)', category_slug: 'delivery' },
  { id: 5302, name: 'Interstate Parcel Delivery', category_slug: 'delivery' },
  { id: 5303, name: 'Motorcycle Dispatch', category_slug: 'delivery' },
  { id: 5304, name: 'Van/Truck Delivery', category_slug: 'delivery' },
  { id: 5305, name: 'Food Delivery (Restaurant)', category_slug: 'delivery' },
  { id: 5306, name: 'Groceries Delivery', category_slug: 'delivery' },
  { id: 5307, name: 'Document Courier', category_slug: 'delivery' },
  { id: 5308, name: 'International Courier (DHL, FedEx alternative)', category_slug: 'delivery' },

  // Rentals (Vehicles/Equipment) (5401–5408)
  { id: 5401, name: 'Car Rental (Self-Drive)', category_slug: 'rentals' },
  { id: 5402, name: 'Car Hire with Driver', category_slug: 'rentals' },
  { id: 5403, name: 'Bus Rental', category_slug: 'rentals' },
  { id: 5404, name: 'Generator Rental', category_slug: 'rentals' },
  { id: 5405, name: 'Construction Equipment Rental', category_slug: 'rentals' },
  { id: 5406, name: 'Event Equipment Rental (Chairs, Tables)', category_slug: 'rentals' },
  { id: 5407, name: 'Sound/Lighting Equipment Rental', category_slug: 'rentals' },
  { id: 5408, name: 'Bouncy Castle/Game Rental', category_slug: 'rentals' },

  // ===== NEW: Transport & Ride Services (5409–5418) =====
  { id: 5409, name: 'Motorcycle (Okada) Transport', category_slug: 'transport' },
  { id: 5410, name: 'Tricycle (Keke) Transport', category_slug: 'transport' },
  { id: 5411, name: 'Airport Pickup/Drop-off', category_slug: 'transport' },
  { id: 5412, name: 'Interstate Transport Booking', category_slug: 'transport' },
  { id: 5413, name: 'Staff Bus Services', category_slug: 'transport' },
  { id: 5414, name: 'School Run Services', category_slug: 'transport' },
  { id: 5415, name: 'Executive Car Service', category_slug: 'transport' },
  { id: 5416, name: 'Wheelchair Transport', category_slug: 'transport' },
  { id: 5417, name: 'Boat/Ferry Transport', category_slug: 'transport' },
  { id: 5418, name: 'Car Pooling Service', category_slug: 'transport' },

  // ====================== SOCIAL ======================
  // Social Groups & Meetups (5501–5506)
  { id: 5501, name: 'Book Clubs', category_slug: 'social-groups' },
  { id: 5502, name: 'Networking Events', category_slug: 'social-groups' },
  { id: 5503, name: 'Fitness/Wellness Groups', category_slug: 'social-groups' },
  { id: 5504, name: 'Religious Study Groups', category_slug: 'social-groups' },
  { id: 5505, name: 'Hobbyist Clubs (Photography, etc.)', category_slug: 'social-groups' },
  { id: 5506, name: 'Support Groups', category_slug: 'social-groups' },

  // Event Spaces & Venues (5601–5608)
  { id: 5601, name: 'Event Halls', category_slug: 'venues' },
  { id: 5602, name: 'Gardens/Outdoor Venues', category_slug: 'venues' },
  { id: 5603, name: 'Meeting Rooms', category_slug: 'venues' },
  { id: 5604, name: 'Conference Centres', category_slug: 'venues' },
  { id: 5605, name: 'Beach Venues', category_slug: 'venues' },
  { id: 5606, name: 'Restaurant Private Rooms', category_slug: 'venues' },
  { id: 5607, name: 'Photo Shoot Locations', category_slug: 'venues' },
  { id: 5608, name: 'Short-let Apartments (Events)', category_slug: 'venues' },

  // ====================== BUSINESS PARTNERS ======================
  // Business Partners (B2B) (5701–5706)
  { id: 5701, name: 'Wholesale Suppliers', category_slug: 'b2b-partners' },
  { id: 5702, name: 'Manufacturers', category_slug: 'b2b-partners' },
  { id: 5703, name: 'Distributors', category_slug: 'b2b-partners' },
  { id: 5704, name: 'Corporate Gifting', category_slug: 'b2b-partners' },
  { id: 5705, name: 'Franchise Opportunities', category_slug: 'b2b-partners' },
  { id: 5706, name: 'Business Collaboration', category_slug: 'b2b-partners' },

  // Business Services (SME) (5801–5808)
  { id: 5801, name: 'Virtual Assistant', category_slug: 'sme-services' },
  { id: 5802, name: 'Customer Support Outsourcing', category_slug: 'sme-services' },
  { id: 5803, name: 'Office Cleaning', category_slug: 'sme-services' },
  { id: 5804, name: 'Waste Disposal', category_slug: 'sme-services' },
  { id: 5805, name: 'Pest Control', category_slug: 'sme-services' },
  { id: 5806, name: 'Office Supplies', category_slug: 'sme-services' },
  { id: 5807, name: 'Printing & Branding for SMEs', category_slug: 'sme-services' },
  { id: 5808, name: 'Business Insurance', category_slug: 'sme-services' },

  // Creative Economy Partners (5901–5906)
  { id: 5901, name: 'Content Creators/Influencers', category_slug: 'creative-partners' },
  { id: 5902, name: 'Music Producers', category_slug: 'creative-partners' },
  { id: 5903, name: 'Film/TV Production Crew', category_slug: 'creative-partners' },
  { id: 5904, name: 'Voice-over Artists', category_slug: 'creative-partners' },
  { id: 5905, name: 'Artisans (Sculptors, Painters)', category_slug: 'creative-partners' },
  { id: 5906, name: 'Fashion Designers (B2B)', category_slug: 'creative-partners' },

  // ====================== TRADE ======================
  // Export Services (6001–6006)
  { id: 6001, name: 'Export Documentation', category_slug: 'export' },
  { id: 6002, name: 'Freight Forwarding (Export)', category_slug: 'export' },
  { id: 6003, name: 'Produce Export (Cocoa, Cashew, etc.)', category_slug: 'export' },
  { id: 6004, name: 'Art & Craft Export', category_slug: 'export' },
  { id: 6005, name: 'Export Compliance', category_slug: 'export' },
  { id: 6006, name: 'Export Market Research', category_slug: 'export' },

  // Import Services (6101–6106)
  { id: 6101, name: 'Customs Clearance', category_slug: 'import' },
  { id: 6102, name: 'Import Sourcing Agent', category_slug: 'import' },
  { id: 6103, name: 'Freight Forwarding (Import)', category_slug: 'import' },
  { id: 6104, name: 'Warehousing', category_slug: 'import' },
  { id: 6105, name: 'Import Duty Calculator', category_slug: 'import' },
  { id: 6106, name: 'Shipping & Logistics', category_slug: 'import' },

  // Cross-Border Traders (6201–6206)
  { id: 6201, name: 'Cross-Border Money Transfer', category_slug: 'cross-border' },
  { id: 6202, name: 'Border Logistics', category_slug: 'cross-border' },
  { id: 6203, name: 'Cross-Border Trade Advisory', category_slug: 'cross-border' },
  { id: 6204, name: 'ECOWAS Trade Support', category_slug: 'cross-border' },
  { id: 6205, name: 'Currency Exchange', category_slug: 'cross-border' },
  { id: 6206, name: 'Cross-Border Transportation', category_slug: 'cross-border' },

  // ===== NEW: Farming & Agriculture (6207–6220) =====
  { id: 6207, name: 'Crop Farming', category_slug: 'agriculture' },
  { id: 6208, name: 'Poultry Farming', category_slug: 'agriculture' },
  { id: 6209, name: 'Fish Farming', category_slug: 'agriculture' },
  { id: 6210, name: 'Snail Farming', category_slug: 'agriculture' },
  { id: 6211, name: 'Livestock Farming', category_slug: 'agriculture' },
  { id: 6212, name: 'Farm Produce Supply', category_slug: 'agriculture' },
  { id: 6213, name: 'Fertilizer & Pesticide Supply', category_slug: 'agriculture' },
  { id: 6214, name: 'Farm Equipment Rental', category_slug: 'agriculture' },
  { id: 6215, name: 'Tractor Hiring', category_slug: 'agriculture' },
  { id: 6216, name: 'Seedling/Nursery Supply', category_slug: 'agriculture' },
  { id: 6217, name: 'Feed Supply', category_slug: 'agriculture' },
  { id: 6218, name: 'Veterinary Services (Farm)', category_slug: 'agriculture' },
  { id: 6219, name: 'Farm Laborers', category_slug: 'agriculture' },
  { id: 6220, name: 'Irrigation Installation', category_slug: 'agriculture' },
];

// Helper functions
export function getCategoriesByTier(tierSlug: string): Category[] {
  return CATEGORIES.filter(c => c.tier_slug === tierSlug);
}

export function getSubcategoriesByCategory(categorySlug: string): Subcategory[] {
  return SUBCATEGORIES.filter(s => s.category_slug === categorySlug);
}

// New helper: returns all categories as a flat array
export const getAllCategories = (): Category[] => {
  const all: Category[] = [];
  for (const tier of TIERS) {
    const cats = getCategoriesByTier(tier.slug);
    all.push(...cats);
  }
  return all;
};