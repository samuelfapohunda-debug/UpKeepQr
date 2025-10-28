// Access the pre-loaded Stripe instance
function getStripe() {
  if (!global.__STRIPE_INSTANCE__) {
    throw new Error('Stripe was not pre-loaded. Check server startup.');
  }
  return global.__STRIPE_INSTANCE__;
}

module.exports = { getStripe };
