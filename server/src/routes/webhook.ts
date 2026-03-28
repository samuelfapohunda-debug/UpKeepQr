import { Router, Request, Response } from "express";
import express from "express";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { db } from "../../db.js";
import { authenticateAgent } from "../../middleware/auth.js";
import {
  orderMagnetOrdersTable,
  orderMagnetItemsTable,
  stripeEventsTable,
  householdsTable,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { createRequire } from "module";
import { generateOrderId } from "../../utils/orderIdGenerator.js";
import { generateQRCodes } from "../../lib/qr.js";
import {
  sendPaymentConfirmationEmail,
  sendWelcomeEmailWithQR,
  sendAdminOrderNotification,
  sendAdminErrorAlert,
  sendSubscriptionWelcomeEmail,
  sendAdminSubscriptionNotification
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
      mode: session.mode,
      metadata: session.metadata
    });

    // Handle subscription checkouts with QR code generation
    if (session.mode === 'subscription') {
      console.log('[WEBHOOK] Processing subscription checkout:', {
        sessionId: session.id,
        eventId: event.id,
        mode: session.mode,
        metadata: session.metadata,
        customerEmail: session.customer_details?.email,
        amountTotal: session.amount_total,
        subscription: session.subscription,
      });
      
      const customerEmail = session.customer_details?.email || session.customer_email || '';
      const customerName = session.customer_details?.name || session.metadata?.customer_name || '';
      const planName = session.metadata?.plan || session.metadata?.plan_id || 'MaintCue Subscription';
      const amountPaid = String((session.amount_total || 0) / 100);
      const subscriptionId = session.subscription || '';
      const baseUrl = process.env.PUBLIC_BASE_URL || 'https://maintcue.com';
      
      let qrCodeCount = 1;
      const planLower = planName.toLowerCase().replace(/[_-]/g, ' ');
      
      if (planLower.includes('property manager') || planLower.includes('property')) {
        qrCodeCount = 200;
      } else if (planLower.includes('realtor') || planLower.includes('agent')) {
        qrCodeCount = 25;
      } else if (planLower.includes('homeowner plus') || planLower.includes('plus')) {
        qrCodeCount = 10;
      } else if (planLower.includes('homeowner basic') || planLower.includes('basic')) {
        qrCodeCount = 1;
      }
      
      console.log(`[WEBHOOK] Plan: ${planName}, QR count: ${qrCodeCount}`);
      
      let generatedQrCodes: Array<{ code: string; qrUrl: string; setupUrl: string }> = [];
      let resultOrderId: string | undefined;

      // Step 0: Idempotency check via stripe_events (non-fatal if table missing)
      try {
        // @ts-expect-error - Drizzle schema inference
        await db.insert(stripeEventsTable).values({
          eventId: event.id,
          eventType: event.type,
          sessionId: session.id,
        });
        console.log(`[WEBHOOK] Recorded event ${event.id} in stripe_events`);
      } catch (idempotencyErr: any) {
        if (idempotencyErr.code === '23505') {
          console.log(`[WEBHOOK] Event ${event.id} already processed (duplicate)`);
          return res.json({ received: true, alreadyProcessed: true, type: 'subscription' });
        }
        console.warn(`[WEBHOOK] stripe_events insert failed (non-fatal):`, idempotencyErr?.message);
      }

      // Step 1: Check if order already exists for this payment_ref (skip order creation but still send email)
      let orderAlreadyExists = false;
      try {
        const existingOrder = await db
          .select({ id: orderMagnetOrdersTable.id, orderId: orderMagnetOrdersTable.orderId })
          .from(orderMagnetOrdersTable)
          .where(eq(orderMagnetOrdersTable.paymentRef, session.id))
          .limit(1);
        if (existingOrder.length > 0) {
          console.log(`[WEBHOOK] Order already exists for session ${session.id}: ${existingOrder[0].orderId}`);
          resultOrderId = existingOrder[0].orderId;
          orderAlreadyExists = true;
        }
      } catch (checkErr: any) {
        console.warn(`[WEBHOOK] Dedup check failed (continuing):`, checkErr?.message);
      }

      // Step 2: Generate QR codes and create order records (skip if order already exists)
      if (!orderAlreadyExists) {
        try {
          const activationCodes = Array.from({ length: qrCodeCount }, () => nanoid(12));
          generatedQrCodes = await generateQRCodes(activationCodes, baseUrl);
          console.log(`[WEBHOOK] Generated ${generatedQrCodes.length} QR codes`);
          
          const orderId = await generateOrderId();
          
          const rawZip = session.customer_details?.address?.postal_code || '';
          const safeZip = rawZip.substring(0, 5);

          await db.transaction(async (tx) => {
            // @ts-expect-error - Drizzle schema inference
            const [order] = await tx.insert(orderMagnetOrdersTable).values({
              orderId,
              customerName: customerName || 'Subscriber',
              customerEmail: customerEmail || '',
              customerPhone: session.customer_details?.phone || '',
              shipAddressLine1: session.customer_details?.address?.line1 || 'N/A',
              shipAddressLine2: session.customer_details?.address?.line2 || '',
              shipCity: session.customer_details?.address?.city || 'N/A',
              shipState: session.customer_details?.address?.state || 'N/A',
              shipZip: safeZip || '00000',
              subtotal: amountPaid,
              total: amountPaid,
              paymentStatus: 'paid',
              paymentProvider: 'stripe',
              paymentRef: session.id,
              status: 'paid'
            }).returning();
            
            for (let i = 0; i < activationCodes.length; i++) {
              // @ts-expect-error - Drizzle schema inference
              await tx.insert(orderMagnetItemsTable).values({
                orderId: order.id,
                sku: `subscription-${planName.toLowerCase().replace(/\s+/g, '-')}`,
                quantity: 1,
                unitPrice: String((session.amount_total || 0) / (100 * qrCodeCount)),
                activationCode: activationCodes[i],
                qrUrl: generatedQrCodes[i].qrUrl,
                activationStatus: 'inactive'
              });
            }
          });

          resultOrderId = orderId;
          console.log(`[WEBHOOK] Created order ${orderId} with ${activationCodes.length} items`);

          // Update stripe_events with order ID (non-fatal)
          try {
            // @ts-expect-error - Drizzle schema inference
            await db.update(stripeEventsTable)
              .set({ orderId })
              .where(eq(stripeEventsTable.eventId, event.id));
          } catch (_) { /* non-fatal */ }
        } catch (error: any) {
          console.error('[WEBHOOK] QR/order creation failed:', error?.message, error?.stack);
          sendAdminErrorAlert(
            'Subscription Webhook - QR Creation Failed',
            error?.message || 'Unknown error',
            { sessionId: session.id, eventId: event.id, customerEmail, planName, errorStack: error?.stack?.substring(0, 500) }
          ).catch(e => console.error('Failed to send error alert:', e));
        }
      } else {
        console.log(`[WEBHOOK] Skipping order creation (already exists), proceeding to send email`);
      }

      // Step 2b: Find or create household and generate password setup token
      let setupUrl: string | undefined;
      if (customerEmail) {
        try {
          const [existing] = await db
            .select({ id: householdsTable.id, passwordHash: householdsTable.passwordHash })
            .from(householdsTable)
            .where(eq(householdsTable.email, customerEmail.toLowerCase()))
            .limit(1);

          const resolvedTier = planName.toLowerCase().includes('property') ? 'property_manager'
            : planName.toLowerCase().includes('realtor') || planName.toLowerCase().includes('agent') ? 'realtor'
            : planName.toLowerCase().includes('plus') ? 'homeowner_plus'
            : 'homeowner_basic';

          let householdId: string;
          if (existing) {
            householdId = existing.id;
            // Always update tier + status for existing households so upgrades/downgrades take effect
            await db
              .update(householdsTable)
              .set({ subscriptionTier: resolvedTier, subscriptionStatus: 'active', updatedAt: new Date() })
              .where(eq(householdsTable.id, householdId));
            console.log(`[WEBHOOK] Updated existing household ${customerEmail} → tier=${resolvedTier}`);
          } else {
            const [created] = await db
              .insert(householdsTable)
              .values({
                name: customerName || 'Subscriber',
                email: customerEmail.toLowerCase(),
                subscriptionStatus: 'active',
                subscriptionTier: resolvedTier,
              })
              .returning({ id: householdsTable.id });
            householdId = created.id;
            console.log(`[WEBHOOK] Created new household for ${customerEmail}: ${householdId} tier=${resolvedTier}`);
          }

          // Generate setup token (24-hour expiry) if no password set yet
          const noPassword = !existing?.passwordHash;
          if (noPassword) {
            const token = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await db
              .update(householdsTable)
              .set({ resetToken: token, resetTokenExpires: expires, updatedAt: new Date() })
              .where(eq(householdsTable.id, householdId));
            const baseUrl = process.env.PUBLIC_BASE_URL || 'https://maintcue.com';
            setupUrl = `${baseUrl}/set-password?token=${token}`;
            console.log(`[WEBHOOK] Setup token generated for ${customerEmail}`);
          }
        } catch (setupErr: any) {
          console.error('[WEBHOOK] Setup token generation failed (non-fatal):', setupErr?.message);
        }
      }

      // Step 3: Send emails (never fail the webhook for email errors)
      try {
        console.log('[WEBHOOK] Sending subscription welcome email to:', customerEmail);
        const emailResult = await sendSubscriptionWelcomeEmail(
          customerEmail,
          customerName,
          planName,
          amountPaid,
          resultOrderId,
          generatedQrCodes,
          setupUrl
        );
        if (emailResult) {
          console.log('[WEBHOOK] Subscription welcome email sent successfully');
        } else {
          console.error('[WEBHOOK] Subscription welcome email returned false');
        }
      } catch (emailErr: any) {
        console.error('[WEBHOOK] Welcome email error:', emailErr?.message, emailErr?.stack);
      }

      try {
        await sendAdminSubscriptionNotification(
          customerEmail,
          customerName,
          planName,
          amountPaid,
          String(subscriptionId),
          qrCodeCount
        );
        console.log('[WEBHOOK] Admin notification sent');
      } catch (emailErr: any) {
        console.error('[WEBHOOK] Admin notification error:', emailErr?.message);
      }

      console.log('[WEBHOOK] Subscription checkout processed:', { plan: planName, qrCodes: qrCodeCount, orderId: resultOrderId });
      return res.json({ 
        received: true, 
        type: 'subscription', 
        plan: planName,
        qrCodesGenerated: qrCodeCount,
        orderId: resultOrderId 
      });
    }

    // Handle one-time payment (magnet orders)
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
      const baseUrl = process.env.PUBLIC_BASE_URL || 'https://maintcue.com';
      
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

      // Respond to Stripe immediately so it doesn't retry
      res.json({ received: true, orderId: resultOrderId });

      // Send emails in the background (fire-and-forget, never blocks webhook)
      console.log('[WEBHOOK] Starting background email dispatch for order:', resultOrderId, 'to:', customerEmail);

      // Email 1: Payment confirmation
      sendPaymentConfirmationEmail(
        customerEmail,
        customerName,
        resultOrderId,
        amountPaid,
        resultMagnetCount
      ).then(result => {
        console.log(`[WEBHOOK] Payment confirmation email ${result ? 'SENT' : 'FAILED'} to: ${customerEmail}`);
      }).catch(error => {
        console.error('[WEBHOOK] Payment confirmation email ERROR:', error?.message);
        sendAdminErrorAlert(
          'Payment Confirmation Email Failed',
          error?.message || 'Unknown error',
          { orderId: resultOrderId, customerEmail, sku, magnetCount: resultMagnetCount }
        ).catch(e => console.error('Failed to send error alert:', e));
      });

      // Email 2: Welcome email with QR codes
      console.log('[WEBHOOK] Dispatching welcome email with QR codes:', {
        email: customerEmail,
        orderId: resultOrderId,
        qrCodesCount: resultQrCodes.length,
        quantity: resultMagnetCount,
        sku
      });
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
      }).then(result => {
        if (result) {
          console.log('[WEBHOOK] Welcome email with QR codes SENT to:', customerEmail);
        } else {
          console.error('[WEBHOOK] Welcome email returned false - check Resend sender verification');
          sendAdminErrorAlert(
            'Welcome Email Failed (returned false)',
            'sendWelcomeEmailWithQR returned false - likely Resend sender verification issue',
            { orderId: resultOrderId, customerEmail, qrCodesCount: resultQrCodes.length }
          ).catch(e => console.error('Failed to send error alert:', e));
        }
      }).catch(error => {
        console.error('[WEBHOOK] Welcome email ERROR:', error?.message);
        sendAdminErrorAlert(
          'Welcome Email Failed',
          error?.message || 'Unknown error',
          { orderId: resultOrderId, customerEmail, qrCodesCount: resultQrCodes.length }
        ).catch(e => console.error('Failed to send error alert:', e));
      });

      // Email 3: Admin notification
      sendAdminOrderNotification(
        resultOrderId,
        customerName,
        customerEmail,
        amountPaid,
        resultMagnetCount,
        sku
      ).then(result => {
        console.log(`[WEBHOOK] Admin notification ${result ? 'SENT' : 'FAILED'}`);
      }).catch(error => {
        console.error('[WEBHOOK] Admin notification ERROR:', error?.message);
      });
      
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

if (process.env.NODE_ENV !== 'production') {
  router.post('/stripe-test', express.json(), async (req: Request, res: Response) => {
    console.log("🧪 Test webhook endpoint hit!");
    const event = req.body;
    if (event.type === 'checkout.session.completed') {
      console.log('📝 Test payment data:', event.data.object);
    }
    res.json({ received: true, test: true });
  });
  
  // Warranty notification test endpoint (admin-only)
  router.get('/test-warranty-check', authenticateAgent, async (req: Request, res: Response) => {
    try {
      console.log('[TEST] Manually triggering warranty expiration check...');
      const { processWarrantyExpirationNotifications } = await import('../../lib/warrantyNotifications.js');
      const result = await processWarrantyExpirationNotifications();
      res.json({ 
        success: true,
        message: 'Warranty check completed',
        result
      });
    } catch (error: any) {
      console.error('[TEST] Warranty check failed:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message
      });
    }
  });

  // Reminder processing test endpoint (admin-only)
  router.get('/test-reminders', authenticateAgent, async (req: Request, res: Response) => {
    try {
      console.log('[TEST] Manually triggering reminder processing...');
      const { triggerReminderProcessing, triggerOverdueUpdate } = await import('../../lib/cron.js');
      await triggerOverdueUpdate();
      await triggerReminderProcessing();
      res.json({ 
        success: true, 
        message: 'Reminder processing and overdue update completed'
      });
    } catch (error: any) {
      console.error('[TEST] Reminder processing failed:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message
      });
    }
  });

  // Email test endpoint for troubleshooting Resend configuration (admin-only)
  router.get('/test-email', authenticateAgent, async (req: Request, res: Response) => {
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
          from: process.env.FROM_EMAIL || 'noreply@maintcue.com'
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Email failed to send',
          details: 'Check server logs for Resend error details'
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
