import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load from outside server/src/ to avoid tsx
const { getStripe } = require('../../lib/stripe-loader.cjs');

export const stripe = getStripe();
