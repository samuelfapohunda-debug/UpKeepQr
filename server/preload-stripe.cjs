// This runs BEFORE tsx is loaded
const Stripe = require('stripe');

if (process.env.STRIPE_SECRET_KEY) {
  global.__STRIPE_INSTANCE__ = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
  console.log('✅ Stripe pre-loaded before tsx');
} else {
  console.warn('⚠️  STRIPE_SECRET_KEY not set - Stripe functionality will be limited');
  global.__STRIPE_INSTANCE__ = null;
}
