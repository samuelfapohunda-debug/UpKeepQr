const path = require('path');
// Load from outside server/src/ to avoid tsx
const { getStripe } = require('../../lib/stripe-loader.cjs');

module.exports = { stripe: getStripe() };
