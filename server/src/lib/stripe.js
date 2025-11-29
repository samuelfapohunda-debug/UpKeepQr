import Stripe from 'stripe';

// Get the Stripe instance from the global (set by preload-stripe.cjs)
// or create a new one if not available
export const stripe = global.__STRIPE_INSTANCE__ || 
  (process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null);

if (!stripe) {
  console.warn('⚠️  Stripe is not available - STRIPE_SECRET_KEY not configured');
}
