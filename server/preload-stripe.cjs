// This runs BEFORE tsx is loaded
const Stripe = require('stripe');

global.__STRIPE_INSTANCE__ = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

console.log('✅ Stripe pre-loaded before tsx');
