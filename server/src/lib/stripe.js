import * as StripeModule from 'stripe';

const Stripe = StripeModule.default || StripeModule;

const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRETE_KEY;

export const stripe = global.__STRIPE_INSTANCE__ || 
  (stripeKey ? new Stripe(stripeKey, { apiVersion: '2024-06-20' }) : null);

if (!stripe) {
  console.warn('[Stripe] Not available - no STRIPE_SECRET_KEY or STRIPE_SECRETE_KEY found');
} else {
  console.log('[Stripe] Instance ready');
}
