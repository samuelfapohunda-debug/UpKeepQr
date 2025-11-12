import { Router, Request, Response } from "express";
import express from "express";
import { nanoid } from "nanoid";
import { db } from "../../db.js";
import {
  orderMagnetOrdersTable,
  orderMagnetItemsTable,
} from "../../../shared/schema.js";
import { createRequire } from "module";
import { generateOrderId } from "../../utils/orderIdGenerator.js";

const require = createRequire(import.meta.url);
const { stripe } = require("../lib/stripe.js");

const router = Router();

console.log('🔧 Webhook router initialized');

router.post('/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  console.log('🔔 Real webhook endpoint hit');
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('🔔 Webhook received');

  if (!sig || !webhookSecret) {
    console.error('❌ Missing webhook signature or secret');
    return res.status(400).json({ error: "Missing webhook signature or secret" });
  }

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
    console.log('✅ Webhook signature verified:', event.type);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err?.message);
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    console.log('💰 Payment successful:', {
      session_id: session.id,
      customer_email: session.customer_details?.email,
      amount: session.amount_total,
      metadata: session.metadata
    });

    try {
      const orderId = await generateOrderId();
      const activationCode = nanoid(12);
      
      const [order] = await db.insert(orderMagnetOrdersTable).values({
        orderId,
        customerName: session.customer_details?.name || '',
        customerEmail: session.customer_details?.email || '',
        customerPhone: session.customer_details?.phone || '',
        shipAddressLine1: session.customer_details?.address?.line1 || '',
        shipAddressLine2: session.customer_details?.address?.line2 || '',
        shipCity: session.customer_details?.address?.city || '',
        shipState: session.customer_details?.address?.state || '',
        shipZip: session.customer_details?.address?.postal_code || '',
        subtotal: String((session.amount_total || 0) / 100),
        total: String((session.amount_total || 0) / 100),
        paymentStatus: 'paid',
        paymentProvider: 'stripe',
        paymentRef: session.id,
        status: 'paid'
      }).returning();

      await db.insert(orderMagnetItemsTable).values({
        orderId: order.id,
        sku: session.metadata?.sku || 'single',
        quantity: parseInt(session.metadata?.quantity || '1'),
        unitPrice: String((session.amount_total || 0) / 100),
        activationCode: activationCode,
        qrUrl: `${process.env.PUBLIC_BASE_URL}/setup/${activationCode}`,
        activationStatus: 'inactive'
      });

      console.log('✅ Order created:', orderId, 'with UUID:', order.id);
    } catch (error: any) {
      console.error('❌ Error creating order:', error?.message);
    }
  }

  res.json({ received: true });
});

if (process.env.NODE_ENV === 'development') {
  router.post('/stripe-test', express.json(), async (req: Request, res: Response) => {
    console.log("🧪 Test webhook endpoint hit!");
    const event = req.body;
    if (event.type === 'checkout.session.completed') {
      console.log('📝 Test payment data:', event.data.object);
    }
    res.json({ received: true, test: true });
  });
}

console.log('✅ Webhook routes registered');

export default router;
