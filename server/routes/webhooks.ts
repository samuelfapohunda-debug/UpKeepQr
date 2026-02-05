import { Router, Request, Response } from "express";
import express from "express";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import {
  orderMagnetOrdersTable,
  orderMagnetItemsTable,
} from "../../../shared/schema.js";
import { sendEmail } from "../../lib/email.js";
import { createRequire } from "module";
import Stripe from "stripe";

const require = createRequire(import.meta.url);
import { stripe } from "../lib/stripe.js";

const router = Router();

console.log('🔧 Webhook router initialized');

router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  // Alias for Stripe's configured endpoint - redirect to main handler
  return router.handle(req, res);
});
  console.log('�� Real webhook endpoint hit');
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  console.log('🔔 Webhook received');
  
  if (!sig || !webhookSecret) {
    console.error('❌ Missing webhook signature or secret');
    return res.status(400).json({ error: "Missing webhook signature or secret" });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
    console.log('✅ Webhook signature verified:', event.type);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    console.log('💰 Payment successful:', {
      session_id: session.id,
      customer_email: session.customer_details?.email,
      amount: session.amount_total,
      metadata: session.metadata
    });

    try {
      // 🛡️ DUPLICATE PREVENTION: Check if order already exists
      const existingOrder = await db.select()
        .from(orderMagnetOrdersTable)
        .where(eq(orderMagnetOrdersTable.paymentRef, session.id))
        .limit(1);

      if (existingOrder.length > 0) {
        console.log('⚠️ Order already processed (duplicate webhook), skipping:', session.id);
        return res.json({ received: true, duplicate: true, orderId: existingOrder[0].id });
      }

      // Validate essential data
      if (!session.customer_details?.email) {
        console.error('❌ Missing customer email - order requires manual review');
        return res.status(200).json({ 
          received: true, 
          requires_review: true,
          reason: 'missing_customer_email' 
        });
      }

      if (!session.amount_total || session.amount_total < 100) {
        console.error('❌ Invalid amount:', session.amount_total);
        return res.status(200).json({ 
          received: true, 
          requires_review: true,
          reason: 'invalid_amount' 
        });
      }

      // Generate unique identifiers
      const orderId = nanoid(16);
      const activationCode = nanoid(12);
      const customerEmail = session.customer_details.email;
      const customerName = session.customer_details?.name || 'Customer';
      const amountPaid = ((session.amount_total || 0) / 100).toFixed(2);
      const qrUrl = `${process.env.PUBLIC_BASE_URL}/setup/${activationCode}`;
      
      // 🔒 Use transaction to ensure both inserts succeed or fail together
      await db.transaction(async (tx) => {
        // Create order in database
        await tx.insert(orderMagnetOrdersTable).values({
          id: orderId,
          customerName: customerName,
          customerEmail: customerEmail,
          customerPhone: session.customer_details?.phone || '',
          shipAddressLine1: session.customer_details?.address?.line1 || '',
          shipAddressLine2: session.customer_details?.address?.line2 || '',
          shipCity: session.customer_details?.address?.city || '',
          shipState: session.customer_details?.address?.state || '',
          shipZip: session.customer_details?.address?.postal_code || '',
          subtotal: String(session.amount_total || 0),
          total: String(session.amount_total || 0),
          paymentStatus: 'paid',
          paymentProvider: 'stripe',
          paymentRef: session.id,
          status: 'paid'
        });

        await tx.insert(orderMagnetItemsTable).values({
          orderId: orderId,
          sku: session.metadata?.sku || 'single',
          quantity: 1,
          unitPrice: String(session.amount_total || 0),
          activationCode: activationCode,
          qrUrl: qrUrl,
          activationStatus: 'inactive'
        });
      });

      console.log('✅ Order created:', orderId);

      // 📧 SEND CUSTOMER CONFIRMATION EMAIL
      if (customerEmail && process.env.SENDGRID_API_KEY) {
        console.log('📧 Sending customer confirmation email to:', customerEmail);
        
        try {
          const customerEmailSent = await sendEmail({
            to: customerEmail,
            from: process.env.FROM_EMAIL || 'noreply@maintcue.com',
            subject: '✅ Your MaintCue Order Confirmation',
            text: `Hi ${customerName},

Thank you for your order! Your payment of $${amountPaid} has been processed successfully.

Order Details:
- Order ID: ${orderId}
- Activation Code: ${activationCode}
- QR Code Setup Link: ${qrUrl}

To activate your QR code magnet, visit: ${qrUrl}

If you have any questions, please contact us.

Best regards,
The MaintCue Team`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h1 style="color: #10b981; margin-bottom: 20px;">Order Confirmed!</h1>
                  
                  <p style="font-size: 16px; color: #333;">Hi ${customerName},</p>
                  
                  <p style="font-size: 16px; color: #333;">
                    Thank you for your order! Your payment of <strong>$${amountPaid}</strong> has been processed successfully.
                  </p>
                  
                  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="color: #1f2937; font-size: 18px; margin-top: 0;">Order Details</h2>
                    <p style="margin: 10px 0; color: #4b5563;">
                      <strong>Order ID:</strong> ${orderId}<br>
                      <strong>Activation Code:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${activationCode}</code>
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${qrUrl}" 
                       style="display: inline-block; background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                      Activate Your QR Code Now
                    </a>
                  </div>
                  
                  <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                    Or copy this link: <a href="${qrUrl}" style="color: #10b981; word-break: break-all;">${qrUrl}</a>
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  
                  <p style="font-size: 14px; color: #6b7280;">
                    Questions? Contact us at support@maintcue.com
                  </p>
                  
                  <p style="font-size: 14px; color: #6b7280;">
                    Best regards,<br>
                    <strong>The MaintCue Team</strong>
                  </p>
                </div>
              </div>
            `
          });

          if (customerEmailSent) {
            console.log('✅ Customer email sent successfully to:', customerEmail);
          } else {
            console.error('⚠️ Customer email failed (sendEmail returned false)');
          }
        } catch (emailError: any) {
          console.error('❌ Error sending customer email:', {
            error: emailError.message,
            customer: customerEmail,
            orderId: orderId
          });
          // Continue processing - don't fail webhook due to email issues
        }
      } else {
        if (!customerEmail) {
          console.log('⚠️ No customer email provided, skipping customer notification');
        }
        if (!process.env.SENDGRID_API_KEY) {
          console.log('⚠️ SENDGRID_API_KEY not set, skipping customer notification');
        }
      }

      // �� SEND ADMIN NOTIFICATION EMAIL
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail && process.env.SENDGRID_API_KEY) {
        console.log('📧 Sending admin notification to:', adminEmail);
        
        try {
          const adminEmailSent = await sendEmail({
            to: adminEmail,
            from: process.env.FROM_EMAIL || 'noreply@maintcue.com',
            subject: `🔔 New MaintCue Order - ${orderId}`,
            text: `New order received!

Order ID: ${orderId}
Customer: ${customerName}
Email: ${customerEmail}
Amount: $${amountPaid}
Activation Code: ${activationCode}
Payment ID: ${session.id}

Setup Link: ${qrUrl}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #059669;">🔔 New Order Received</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <tr style="background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; font-weight: bold; width: 180px;">Order ID:</td>
                    <td style="padding: 12px;"><code>${orderId}</code></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; font-weight: bold;">Customer:</td>
                    <td style="padding: 12px;">${customerName}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; font-weight: bold;">Email:</td>
                    <td style="padding: 12px;">${customerEmail}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; font-weight: bold;">Amount Paid:</td>
                    <td style="padding: 12px; color: #059669; font-weight: bold; font-size: 18px;">$${amountPaid}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; font-weight: bold;">Activation Code:</td>
                    <td style="padding: 12px;"><code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${activationCode}</code></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; font-weight: bold;">Payment ID:</td>
                    <td style="padding: 12px; font-size: 12px; color: #6b7280;">${session.id}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; font-weight: bold;">Setup Link:</td>
                    <td style="padding: 12px;"><a href="${qrUrl}" style="color: #10b981; word-break: break-all;">${qrUrl}</a></td>
                  </tr>
                </table>
                <p style="margin-top: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; font-size: 14px;">
                  <strong>⚠️ Action Required:</strong> Process shipment and notify customer when item is shipped.
                </p>
              </div>
            `
          });

          if (adminEmailSent) {
            console.log('✅ Admin notification sent successfully');
          } else {
            console.error('⚠️ Admin notification failed (sendEmail returned false)');
          }
        } catch (emailError: any) {
          console.error('❌ Error sending admin notification:', {
            error: emailError.message,
            admin: adminEmail,
            orderId: orderId
          });
          // Continue processing - don't fail webhook due to email issues
        }
      } else {
        if (!adminEmail) {
          console.log('⚠️ ADMIN_EMAIL not set in .env, skipping admin notification');
        }
        if (!process.env.SENDGRID_API_KEY) {
          console.log('⚠️ SENDGRID_API_KEY not set, skipping admin notification');
        }
      }

    } catch (error: any) {
      console.error('❌ Error processing webhook:', {
        error: error.message,
        stack: error.stack,
        sessionId: session.id
      });
      
      // Check if this is a database constraint violation (duplicate)
      if (error.code === '23505') {
        console.log('⚠️ Duplicate order detected via database constraint');
        return res.json({ received: true, duplicate: true });
      }
      
      // For other database errors, return 500 so Stripe will retry
      console.error('🔄 Returning 500 - Stripe will retry this webhook');
      return res.status(500).json({ 
        error: 'Processing failed', 
        retryable: true 
      });
    }
  }

  // Always return 200 for successful processing
  res.json({ received: true });
});

// Development-only test endpoint
if (process.env.NODE_ENV === 'development') {
  router.post('/webhooks/stripe-test', express.json(), async (req: Request, res: Response) => {
    try {
      console.log("🧪 Test webhook endpoint hit!");
      const event = req.body;
      
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        console.log('📝 Test payment data:', session);
        console.log("🔍 DEBUG: About to create orderId");
        
        const orderId = nanoid(16);
        const activationCode = nanoid(12);
        const customerEmail = session.customer_details?.email || 'test@test.com';
        const customerName = session.customer_details?.name || 'Test Customer';
        const amountPaid = ((session.amount_total || 0) / 100).toFixed(2);
        const qrUrl = `${process.env.PUBLIC_BASE_URL}/setup/${activationCode}`;
        
        console.log('💰 Processing test payment:', { orderId, customerEmail, amount: amountPaid });
        
        if (customerEmail && process.env.SENDGRID_API_KEY) {
          console.log('�� Sending test email to:', customerEmail);
          try {
            const emailSent = await sendEmail({
              to: customerEmail,
              from: process.env.FROM_EMAIL || 'noreply@maintcue.com',
              subject: '✅ [TEST] Your MaintCue Order',
              text: `Hi ${customerName}, Order ID: ${orderId}, Code: ${activationCode}`,
              html: `<h1>✅ TEST Order</h1><p>Hi ${customerName}</p><p>Order: ${orderId}</p><p>Code: ${activationCode}</p>`
            });
            console.log(emailSent ? '✅ Email sent!' : '❌ Email failed');
          } catch (error: any) {
            console.error('❌ Email error:', error.message);
          }
        } else {
          console.log('⚠️ Skipping email: no email or no SendGrid API key');
        }
      }
      
      res.json({ received: true, test: true, processed: true });
    } catch (error: any) {
      console.error('❌ WEBHOOK ERROR:', error);
      res.status(500).json({ error: error.message });
    }
  });
}

console.log('✅ Webhook routes registered');

export default router;
