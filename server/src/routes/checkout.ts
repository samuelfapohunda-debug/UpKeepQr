import { Router } from 'express';
import { checkoutSchema } from '../../../shared/schema';

const router = Router();

const SKU_CONFIG = {
  single: { name: '1 QR Magnet', description: 'Single QR magnet for home maintenance tracking', price: 1900, quantity: 1 },
  twopack: { name: '2 QR Magnets', description: 'Two QR magnets for home maintenance tracking', price: 3500, quantity: 2 },
  '100pack': { name: 'Agent 100-Pack', description: '100 QR magnets for real estate agents', price: 89900, quantity: 100, isAgentPack: true },
};

router.post('/', async (req, res) => {
  try {
    const stripe = (global as any).__STRIPE_INSTANCE__;
    
    if (!stripe) {
      console.error('[Checkout] Stripe not configured');
      return res.status(500).json({ error: 'Payment system not configured' });
    }

    const validatedData = checkoutSchema.parse(req.body);
    const { sku, agentId } = validatedData;

    const skuConfig = SKU_CONFIG[sku as keyof typeof SKU_CONFIG];
    if (!skuConfig) {
      return res.status(400).json({ error: 'Invalid SKU' });
    }

    const baseUrl = req.headers.origin || `${req.protocol}://${req.get('host')}` || 'http://localhost:5000';
    const successUrl = `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    
    console.log('[Stripe Checkout] Base URL:', baseUrl);
    console.log('[Stripe Checkout] Success URL:', successUrl);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: skuConfig.name,
              description: skuConfig.description,
            },
            unit_amount: skuConfig.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: `${baseUrl}/?canceled=true`,
      metadata: {
        sku,
        agentId: agentId || '',
        quantity: skuConfig.quantity.toString(),
        isAgentPack: (skuConfig as any).isAgentPack ? 'true' : 'false',
      },
    });

    console.log('[Stripe Checkout] Session created:', session.id);
    
    res.json({ 
      sessionId: session.id,
      checkoutUrl: session.url 
    });
  } catch (error: any) {
    console.error('[Checkout] Error:', error);
    if (error?.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid checkout data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  }
});

router.post('/create-subscription-checkout', async (req, res) => {
  try {
    const stripe = (global as any).__STRIPE_INSTANCE__;
    
    if (!stripe) {
      console.error('[Subscription Checkout] Stripe not configured');
      return res.status(500).json({ error: 'Payment system not configured' });
    }

    const { priceId, plan } = req.body;

    const PLAN_TO_PRICE_MAP: Record<string, string | undefined> = {
      'homeowner_basic_yearly': process.env.STRIPE_PRICE_HOMEOWNER_BASIC_YEARLY,
      'homeowner_plus_yearly': process.env.STRIPE_PRICE_HOMEOWNER_PLUS_YEARLY,
      'realtor_yearly': process.env.STRIPE_PRICE_REALTOR_YEARLY,
      'property_manager_yearly': process.env.STRIPE_PRICE_PROPERTY_MANAGER_YEARLY,
      'homeowner_basic_monthly': process.env.STRIPE_PRICE_HOMEOWNER_BASIC_MONTHLY,
      'homeowner_plus_monthly': process.env.STRIPE_PRICE_HOMEOWNER_PLUS_MONTHLY,
      'realtor_monthly': process.env.STRIPE_PRICE_REALTOR_MONTHLY,
      'property_manager_monthly': process.env.STRIPE_PRICE_PROPERTY_MANAGER_MONTHLY,
    };

    const actualPriceId = PLAN_TO_PRICE_MAP[priceId] || priceId;

    // Allow direct Stripe price IDs (start with 'price_')
    const isDirectPriceId = actualPriceId?.startsWith('price_');
    const validPriceIds = Object.values(PLAN_TO_PRICE_MAP).filter(Boolean);
    
    if (!actualPriceId || (!isDirectPriceId && validPriceIds.length > 0 && !validPriceIds.includes(actualPriceId))) {
      console.error('[Subscription Checkout] Invalid or missing price ID. Received:', priceId, 'Mapped to:', actualPriceId);
      console.error('[Subscription Checkout] Available price IDs:', validPriceIds);
      return res.status(400).json({ 
        error: 'Subscription checkout is not yet configured. Please contact support.',
        details: 'Price IDs not set up in environment variables.'
      });
    }
    
    console.log('[Subscription Checkout] Using price ID:', actualPriceId, 'for plan:', plan);

    const baseUrl = req.headers.origin || `${req.protocol}://${req.get('host')}` || 'http://localhost:5000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: actualPriceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        plan: plan || '',
      },
    });

    console.log('[Subscription Checkout] Session created:', session.id, 'Plan:', plan);
    
    res.json({ url: session.url });
  } catch (error: any) {
    console.error('[Subscription Checkout] Error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

export default router;
