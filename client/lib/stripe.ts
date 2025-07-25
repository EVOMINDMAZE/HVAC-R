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
      'Standard cycle analysis',
      'Basic refrigerant comparison',
      'Email support'
    ]
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    price: 29,
    interval: 'month',
    calculations: -1, // unlimited
    features: [
      'Unlimited calculations',
      'All analysis tools',
      'Advanced refrigerant comparison',
      'Cascade cycle analysis',
      'PDF export',
      'Priority support',
      'API access'
    ],
    stripePriceId: STRIPE_PRICE_IDS.PROFESSIONAL_MONTHLY
  },
  PROFESSIONAL_YEARLY: {
    id: 'professional_yearly',
    name: 'Professional (Yearly)',
    price: 290,
    interval: 'year',
    calculations: -1,
    features: [
      'Unlimited calculations',
      'All analysis tools',
      'Advanced refrigerant comparison',
      'Cascade cycle analysis',
      'PDF export',
      'Priority support',
      'API access',
      '2 months free'
    ],
    stripePriceId: STRIPE_PRICE_IDS.PROFESSIONAL_YEARLY
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    interval: 'month',
    calculations: -1,
    features: [
      'Everything in Professional',
      'Team collaboration',
      'Custom integrations',
      'White-label options',
      'Dedicated support',
      'SLA guarantee',
      'Custom training'
    ],
    stripePriceId: STRIPE_PRICE_IDS.ENTERPRISE_MONTHLY
  },
  ENTERPRISE_YEARLY: {
    id: 'enterprise_yearly',
    name: 'Enterprise (Yearly)',
    price: 990,
    interval: 'year',
    calculations: -1,
    features: [
      'Everything in Professional',
      'Team collaboration',
      'Custom integrations',
      'White-label options',
      'Dedicated support',
      'SLA guarantee',
      'Custom training',
      '2 months free'
    ],
    stripePriceId: STRIPE_PRICE_IDS.ENTERPRISE_YEARLY
  }
};
