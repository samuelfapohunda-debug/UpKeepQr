import Stripe from 'stripe';

console.log('Stripe type:', typeof Stripe);
console.log('Is constructor?', typeof Stripe === 'function');

try {
  const stripe = new Stripe('sk_test_dummy', {
    apiVersion: '2024-06-20'
  });
  console.log('✅ Stripe initialized successfully!');
  console.log('Stripe instance:', typeof stripe);
} catch (error) {
  console.error('❌ Failed to initialize:', error.message);
}
