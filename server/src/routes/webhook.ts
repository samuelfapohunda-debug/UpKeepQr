import { Router, Request, Response } from "express";
import express from "express";
import { nanoid } from "nanoid";
import { db } from "../../db.js";
import {
  orderMagnetOrdersTable,
  orderMagnetItemsTable,
  stripeEventsTable,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { createRequire } from "module";
import { generateOrderId } from "../../utils/orderIdGenerator.js";
import { generateQRCodes } from "../../lib/qr.js";
import {
  sendPaymentConfirmationEmail,
  sendWelcomeEmailWithQR,
  sendAdminOrderNotification,
  sendAdminErrorAlert
} from "../../lib/email.js";

const require = createRequire(import.meta.url);
import { stripe } from "../lib/stripe.js";

const router = Router();

console.log('🔧 Webhook router initialized');

// Note: Raw body middleware is applied at app level in server/index.ts before express.json()
router.post('/stripe', async (req: Request, res: Response) => {
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
      event_id: event.id,
      session_id: session.id,
      customer_email: session.customer_details?.email,
      amount: session.amount_total,
      metadata: session.metadata
    });

    try {
      // Determine quantity based on SKU (need this before transaction)
      const sku = session.metadata?.sku || 'single';
      let magnetCount = 1;
      switch (sku) {
        case 'single':
          magnetCount = 1;
          break;
        case 'twopack':
          magnetCount = 2;
          break;
        case '100pack':
          magnetCount = 100;
          break;
        default:
          magnetCount = parseInt(session.metadata?.quantity || '1');
      }

      const customerName = session.customer_details?.name || '';
      const customerEmail = session.customer_details?.email || '';
      const amountPaid = String((session.amount_total || 0) / 100);
      const baseUrl = process.env.PUBLIC_BASE_URL || 'https://upkeepqr.com';
      
      // Generate activation codes and QR codes before transaction
      const activationCodes = Array.from({ length: magnetCount }, () => nanoid(12));
      const qrCodes = await generateQRCodes(activationCodes, baseUrl);
      console.log(`🎯 Generated ${qrCodes.length} QR codes`);

      // Wrap in transaction for idempotency + order creation
      const result = await db.transaction(async (tx) => {
        // First, try to insert the event ID (primary key ensures idempotency)
        try {
          await tx.insert(stripeEventsTable).values({
            eventId: event.id,
            eventType: event.type,
            sessionId: session.id,
          });
          console.log(`🆕 Processing new event: ${event.id}`);
        } catch (error: any) {
          // If unique constraint violation, webhook already processed
          if (error.code === '23505') {
            const existingEvent = await tx.query.stripeEventsTable.findFirst({
              where: (events, { eq }) => eq(events.eventId, event.id)
            });
            console.log(`✅ Event ${event.id} already processed, order: ${existingEvent?.orderId}`);
            return { alreadyProcessed: true, orderId: existingEvent?.orderId };
          }
          throw error; // Re-throw unexpected errors
        }
        
        // Generate sequential Order ID
        const orderId = await generateOrderId();
        
        // Create order
        // @ts-expect-error - TypeScript LSP cache issue with Drizzle schema inference, works at runtime
        const [order] = await tx.insert(orderMagnetOrdersTable).values({
          orderId,
          customerName,
          customerEmail,
          customerPhone: session.customer_details?.phone || '',
          shipAddressLine1: session.customer_details?.address?.line1 || '',
          shipAddressLine2: session.customer_details?.address?.line2 || '',
          shipCity: session.customer_details?.address?.city || '',
          shipState: session.customer_details?.address?.state || '',
          shipZip: session.customer_details?.address?.postal_code || '',
          subtotal: amountPaid,
          total: amountPaid,
          paymentStatus: 'paid',
          paymentProvider: 'stripe',
          paymentRef: session.id,
          status: 'paid'
        }).returning();

        console.log('✅ Order created:', orderId, 'with UUID:', order.id);

        // Update event record with order ID
        await tx.update(stripeEventsTable)
          .set({ orderId })
          .where(eq(stripeEventsTable.eventId, event.id));

        // Create order items (one per magnet with its activation code)
        for (let i = 0; i < activationCodes.length; i++) {
          const code = activationCodes[i];
          const qr = qrCodes[i];
          
          // @ts-expect-error - TypeScript LSP cache issue with Drizzle schema inference, works at runtime
          await tx.insert(orderMagnetItemsTable).values({
            orderId: order.id,
            sku,
            quantity: 1, // Each item is 1 magnet
            unitPrice: String((session.amount_total || 0) / (100 * magnetCount)), // Split cost per magnet
            activationCode: code,
            qrUrl: qr.qrUrl,  // Store the QR image data URL, not the setup URL
            activationStatus: 'inactive'
          });
        }

        console.log(`✅ Created ${activationCodes.length} order items with activation codes`);
        
        return { alreadyProcessed: false, order, orderId, qrCodes, magnetCount };
      });
      
      // If already processed, return early
      if (result.alreadyProcessed) {
        return res.json({ received: true, orderId: result.orderId, alreadyProcessed: true });
      }
      
      const { orderId: resultOrderId, qrCodes: resultQrCodes, magnetCount: resultMagnetCount } = result;

      // Send emails (non-blocking - don't fail webhook if emails fail)
      Promise.all([
        // Email 1: Payment confirmation
        sendPaymentConfirmationEmail(
          customerEmail,
          customerName,
          resultOrderId,
          amountPaid,
          resultMagnetCount
        ).catch(error => {
          console.error('❌ Failed to send payment confirmation:', error);
          sendAdminErrorAlert(
            'Payment Confirmation Email Failed',
            error.message,
            { orderId: resultOrderId, customerEmail, sku, magnetCount: resultMagnetCount }
          ).catch(e => console.error('Failed to send error alert:', e));
        }),
        
        // Email 2: Welcome email with QR codes
        sendWelcomeEmailWithQR({
          email: customerEmail,
          customerName,
          orderId: resultOrderId,
          items: resultQrCodes.map(qr => ({
            activationCode: qr.code,
            qrCodeImage: qr.qrUrl,
            setupUrl: qr.setupUrl
          })),
          quantity: resultMagnetCount,
          sku
        }).catch(error => {
          console.error('❌ Failed to send welcome email:', error);
          sendAdminErrorAlert(
            'Welcome Email Failed',
            error.message,
            { orderId: resultOrderId, customerEmail, qrCodesCount: resultQrCodes.length }
          ).catch(e => console.error('Failed to send error alert:', e));
        }),
        
        // Email 3: Admin notification
        sendAdminOrderNotification(
          resultOrderId,
          customerName,
          customerEmail,
          amountPaid,
          resultMagnetCount,
          sku
        ).catch(error => {
          console.error('❌ Failed to send admin notification:', error);
        })
      ]).then(() => {
        console.log('✅ All emails sent successfully');
      }).catch(error => {
        console.error('❌ Some emails failed:', error);
      });

      // Return success immediately (don't wait for emails)
      res.json({ received: true, orderId: resultOrderId });
      
    } catch (error: any) {
      console.error('❌ Error processing order:', error?.message);
      console.error('Full error:', error);
      
      // Send admin alert about critical error
      sendAdminErrorAlert(
        'Stripe Webhook Order Creation Failed',
        error?.message || 'Unknown error',
        { 
          sessionId: session.id,
          customerEmail: session.customer_details?.email,
          amount: session.amount_total 
        }
      ).catch(e => console.error('Failed to send error alert:', e));
      
      return res.status(500).json({ error: 'Failed to create order', details: error?.message });
    }
  } else {
    res.json({ received: true, skipped: true, eventType: event.type });
  }
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
  
  // Email test endpoint for troubleshooting SendGrid configuration
  router.get('/test-email', async (req: Request, res: Response) => {
    try {
      const testEmail = req.query.email as string || 'samuel.fapohunda@gmail.com';
      console.log('🧪 Testing email configuration...');
      
      const result = await sendPaymentConfirmationEmail(
        testEmail,
        'Test Customer',
        'TEST-2025',
        '99.99',
        1
      );
      
      if (result) {
        res.json({ 
          success: true, 
          message: 'Email sent successfully',
          to: testEmail,
          from: process.env.FROM_EMAIL || 'noreply@upkeepqr.com'
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Email failed to send',
          details: 'Check server logs for SendGrid error details'
        });
      }
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: error.message,
        details: error.response?.body || 'No details available'
      });
    }
  });
}

console.log('✅ Webhook routes registered');

export default router;
