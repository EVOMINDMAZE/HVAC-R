import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
);

export { stripePromise };

function requirePriceId(envKey: string): string {
  const value = import.meta.env[envKey];
  if (!value) {
    throw new Error(
      `[stripe] Missing required build-time env var ${envKey}. ` +
        `Checkout would send an invalid price ID to Stripe. Set it in Netlify/Vercel build settings and rebuild.`,
    );
  }
  return value;
}

export const STRIPE_PRICE_IDS = {
  get PROFESSIONAL_MONTHLY() { return requirePriceId('VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID'); },
  get PROFESSIONAL_YEARLY() { return requirePriceId('VITE_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID'); },
  get ENTERPRISE_MONTHLY() { return requirePriceId('VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID'); },
  get ENTERPRISE_YEARLY() { return requirePriceId('VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID'); },
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
      'Priority email support',
      '10 saved projects',
      'Basic white-label (personal logo on reports)'
    ],
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
      'Priority email support',
      '10 saved projects',
      'Basic white-label (personal logo on reports)',
      '2 months free'
    ],
  },
  BUSINESS: {
    id: 'business',
    name: 'Precision Engineering Hub',
    price: 199,
    interval: 'month',
    calculations: -1,
    features: [
      'Skool Community Access',
      'White-labeled Pro App',
      'Automation Engine (Review Hunter, Invoice Chaser)',
      'Everything in Pro',
      'Team collaboration (up to 5 users included)',
      'Client portal for customer access',
      'Advanced analytics & business dashboards',
      'Custom training sessions',
      'SLA guarantee',
      'Unlimited projects',
      'Dedicated support'
    ],
  },
  BUSINESS_YEARLY: {
    id: 'business_yearly',
    name: 'Precision Engineering Hub (Yearly)',
    price: 1990,
    interval: 'year',
    calculations: -1,
    features: [
      'Skool Community Access',
      'White-labeled Pro App',
      'Automation Engine (Review Hunter, Invoice Chaser)',
      'Everything in Pro',
      'Team collaboration (up to 5 users included)',
      'Client portal for customer access',
      'Advanced analytics & business dashboards',
      'Custom training sessions',
      'SLA guarantee',
      'Unlimited projects',
      'Dedicated support',
      '2 months free'
    ],
  }
};
