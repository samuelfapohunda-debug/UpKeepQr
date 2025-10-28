import * as StripeModule from 'stripe';

console.log('StripeModule type:', typeof StripeModule);
console.log('StripeModule keys:', Object.keys(StripeModule));
console.log('StripeModule.default:', typeof StripeModule.default);
console.log('StripeModule.Stripe:', typeof StripeModule.Stripe);

const Stripe = StripeModule.default || StripeModule.Stripe || StripeModule;
console.log('Final Stripe type:', typeof Stripe);

try {
  const stripe = new Stripe('sk_test_dummy', {
    apiVersion: '2024-06-20'
  });
  console.log('✅ Stripe initialized successfully!');
} catch (error) {
  console.error('❌ Failed:', error.message);
}
