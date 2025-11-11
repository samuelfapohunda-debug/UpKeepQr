// Access the pre-loaded Stripe instance
function getStripe() {
  if (!global.__STRIPE_INSTANCE__) {
    console.warn('⚠️  Stripe is not available - STRIPE_SECRET_KEY not configured');
    return null;
  }
  return global.__STRIPE_INSTANCE__;
}

module.exports = { getStripe };
