import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
);

export { stripePromise };

export const STRIPE_PRICE_IDS = {
  PROFESSIONAL_MONTHLY: import.meta.env.VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || 'price_professional_monthly',
  PROFESSIONAL_YEARLY: import.meta.env.VITE_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || 'price_professional_yearly',
  ENTERPRISE_MONTHLY: import.meta.env.VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || 'price_enterprise_monthly',
  ENTERPRISE_YEARLY: import.meta.env.VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly',
};

export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    calculations: 10,
    features: [
      'Up to 10 calculations per month',
      'Standard cycle analysis (basic parameters)',
      'Basic refrigerant comparison (2 refrigerants max)',
      'Compliance reference (read-only)',
      'Dashboard with usage tracking',
      'Email support',
      '1 saved project'
    ]
  },
  PRO: {
    id: 'professional',
    name: 'Pro',
    price: 49,
    interval: 'month',
    calculations: -1, // unlimited
    features: [
      'Unlimited calculations',
      'All analysis tools (cascade, advanced cycles)',
      'Advanced refrigerant comparison (unlimited)',
      'PDF export & advanced reporting',
      'API access for integrations',
      'Priority email support',
      '10 saved projects',
      'Basic white-label (personal logo on reports)'
    ],
    stripePriceId: STRIPE_PRICE_IDS.PROFESSIONAL_MONTHLY
  },
  PRO_YEARLY: {
    id: 'professional_yearly',
    name: 'Pro (Yearly)',
    price: 490,
    interval: 'year',
    calculations: -1,
    features: [
      'Unlimited calculations',
      'All analysis tools (cascade, advanced cycles)',
      'Advanced refrigerant comparison (unlimited)',
      'PDF export & advanced reporting',
      'API access for integrations',
      'Priority email support',
      '10 saved projects',
      'Basic white-label (personal logo on reports)',
      '2 months free'
    ],
    stripePriceId: STRIPE_PRICE_IDS.PROFESSIONAL_YEARLY
  },
  BUSINESS: {
    id: 'business',
    name: 'Business',
    price: 199,
    interval: 'month',
    calculations: -1,
    features: [
      'Everything in Pro',
      'Team collaboration (up to 5 users included)',
      'White-label branding (company logo, colors, domain)',
      'Client portal for customer access',
      'Automation engine (Review Hunter, Invoice Chaser)',
      'Advanced analytics & business dashboards',
      'Custom training sessions',
      'SLA guarantee',
      'Unlimited projects',
      'Dedicated support'
    ],
    stripePriceId: STRIPE_PRICE_IDS.ENTERPRISE_MONTHLY
  },
  BUSINESS_YEARLY: {
    id: 'business_yearly',
    name: 'Business (Yearly)',
    price: 1990,
    interval: 'year',
    calculations: -1,
    features: [
      'Everything in Pro',
      'Team collaboration (up to 5 users included)',
      'White-label branding (company logo, colors, domain)',
      'Client portal for customer access',
      'Automation engine (Review Hunter, Invoice Chaser)',
      'Advanced analytics & business dashboards',
      'Custom training sessions',
      'SLA guarantee',
      'Unlimited projects',
      'Dedicated support',
      '2 months free'
    ],
    stripePriceId: STRIPE_PRICE_IDS.ENTERPRISE_YEARLY
  }
};
