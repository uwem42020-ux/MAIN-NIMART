// Exchange rate: 1 Nicoin = ₦50
export const NAIRA_PER_NICOIN = 50;

// Boost & placement costs (in Nicoin)
export const STANDARD_BOOST_COST = 200;      // 7 days
export const PREMIUM_BOOST_COST = 500;      // 30 days
export const TOP_PLACEMENT_COST = 1000;     // 7 days
export const EXTRA_CATEGORY_COST = 300;     // per extra category

// Referral bonus (awarded to both referrer and new provider)
export const REFERRAL_BONUS = 200;          // each side

// Helper to convert Nicoin to Naira
export const nicoinToNaira = (nicoin: number) => nicoin * NAIRA_PER_NICOIN;