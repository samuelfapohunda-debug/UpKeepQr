// This runs BEFORE tsx is loaded
const Stripe = require('stripe');

// Support both correct and misspelled secret name
const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRETE_KEY;

if (stripeKey) {
  global.__STRIPE_INSTANCE__ = new Stripe(stripeKey, {
    apiVersion: '2024-06-20',
  });
  console.log('✅ Stripe pre-loaded before tsx');
} else {
  console.warn('⚠️  STRIPE_SECRET_KEY not set - Stripe functionality will be limited');
  global.__STRIPE_INSTANCE__ = null;
}
