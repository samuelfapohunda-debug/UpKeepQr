import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const stripe = require('stripe');
console.log('With tsx - Type:', typeof stripe);
console.log('With tsx - Keys:', Object.keys(stripe));
console.log('With tsx - Default:', typeof stripe.default);
console.log('With tsx - Stripe prop:', typeof stripe.Stripe);
