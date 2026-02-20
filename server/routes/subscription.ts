import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { db } from "../db";
import { householdsTable, subscriptionEventsTable, cancellationFeedbackTable, emailEventsTable, signupAttemptsTable } from "@shared/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { checkTrialAbuse, logSignupAttempt } from "../lib/trialAbuse";
import { canonicalizeEmail } from "../lib/emailCanonicalization";
import { checkFeatureAccess } from "../lib/featureGating";
import { requireSessionAuth, type SessionAuthRequest } from "../middleware/sessionAuth";
import {
  sendTrialWelcomeEmail,
  sendPreChargeReminderEmail,
  sendPaymentFailedEmail,
  sendSubscriptionActiveEmail,
  sendCancellationConfirmedEmail,
  sendAccountSuspendedEmail,
} from "../lib/subscriptionEmails";
import type Stripe from "stripe";

const stripe = (global as any).__STRIPE_INSTANCE__;

const TRIAL_DAYS = 30;
const GRACE_PERIOD_DAYS = 3;
const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID || '';
const ANNUAL_PRICE_ID = process.env.STRIPE_ANNUAL_PRICE_ID || '';

async function logSubscriptionEvent(
  householdId: string | null,
  stripeEventType: string,
  stripeEventId: string,
  statusBefore: string | null,
  statusAfter: string | null,
  metadata?: Record<string, unknown>,
  processingError?: string
): Promise<void> {
  try {
    await db.insert(subscriptionEventsTable).values({
      householdId,
      stripeEventType: stripeEventType,
      stripeEventId: stripeEventId,
      subscriptionStatusBefore: statusBefore,
      subscriptionStatusAfter: statusAfter,
      metadata: metadata || null,
      processingError: processingError || null,
    });
  } catch (err) {
    console.error("Failed to log subscription event:", err);
  }
}

async function getHouseholdByStripeCustomerId(customerId: string) {
  const results = await db
    .select()
    .from(householdsTable)
    .where(eq(householdsTable.stripeCustomerId, customerId))
    .limit(1);
  return results[0] || null;
}

async function getHouseholdByStripeSubscriptionId(subscriptionId: string) {
  const results = await db
    .select()
    .from(householdsTable)
    .where(eq(householdsTable.stripeSubscriptionId, subscriptionId))
    .limit(1);
  return results[0] || null;
}

export function registerSubscriptionRoutes(app: Express) {
  
  app.post("/api/subscription/trial-signup", express.json(), async (req: Request, res: Response) => {
    try {
      const { email, name, billingInterval, paymentMethodId, termsAccepted, deviceFingerprint } = req.body;

      if (!email || !name || !billingInterval || !paymentMethodId || !termsAccepted) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!['monthly', 'annual'].includes(billingInterval)) {
        return res.status(400).json({ error: "Invalid billing interval" });
      }

      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '';
      const userAgent = req.headers['user-agent'] || '';

      const abuseCheck = await checkTrialAbuse(email, ipAddress, deviceFingerprint);

      if (abuseCheck.blocked) {
        await logSignupAttempt(email, ipAddress, userAgent, deviceFingerprint, false, abuseCheck.reason);
        return res.status(403).json({ error: abuseCheck.reason });
      }

      const canonical = canonicalizeEmail(email);

      if (!stripe) {
        return res.status(500).json({ error: "Payment system not configured" });
      }

      const customer = await stripe.customers.create({
        email: email.toLowerCase(),
        name,
        metadata: { canonical_email: canonical },
      });

      await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
      await stripe.customers.update(customer.id, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      const priceId = billingInterval === 'monthly' ? MONTHLY_PRICE_ID : ANNUAL_PRICE_ID;

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        trial_period_days: TRIAL_DAYS,
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        metadata: { canonical_email: canonical },
      });

      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

      const [household] = await db.insert(householdsTable).values({
        name,
        email: email.toLowerCase(),
        canonicalEmail: canonical,
        subscriptionTier: 'basic',
        billingInterval,
        subscriptionStatus: 'trialing',
        trialStartsAt: trialStart,
        trialEndsAt: trialEnd,
        trialUsed: true,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        stripePaymentMethodId: paymentMethodId,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
        signupIpAddress: ipAddress,
        signupUserAgent: userAgent,
        paymentAddedAt: new Date(),
        setupStatus: 'not_started',
        createdBy: 'customer',
      }).returning();

      await logSignupAttempt(email, ipAddress, userAgent, deviceFingerprint, true);

      try {
        await sendTrialWelcomeEmail(email, name, trialEnd);
        await db.insert(emailEventsTable).values({
          householdId: household.id,
          emailType: 'trial_welcome',
        });
      } catch (emailErr) {
        console.error("Failed to send trial welcome email:", emailErr);
      }

      res.status(201).json({
        success: true,
        householdId: household.id,
        trialEndsAt: trialEnd.toISOString(),
        subscriptionStatus: 'trialing',
      });
    } catch (error: any) {
      console.error("Trial signup error:", error);
      res.status(500).json({ error: "Failed to create trial subscription" });
    }
  });

  app.post("/api/subscription/cancel", requireSessionAuth, express.json(), async (req: Request, res: Response) => {
    try {
      const sessionReq = req as SessionAuthRequest;
      const householdId = sessionReq.sessionHouseholdId;
      const { reason, feedback } = req.body;

      if (!householdId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const households = await db
        .select()
        .from(householdsTable)
        .where(eq(householdsTable.id, householdId))
        .limit(1);

      const household = households[0];
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }

      if (!household.stripeSubscriptionId) {
        return res.status(400).json({ error: "No active subscription found" });
      }

      if (stripe) {
        await stripe.subscriptions.update(household.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      await db.update(householdsTable).set({
        cancelAtPeriodEnd: true,
        cancellationReason: reason || null,
        cancellationSource: 'self_service',
        canceledAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(householdsTable.id, householdId));

      if (reason || feedback) {
        await db.insert(cancellationFeedbackTable).values({
          householdId,
          reason: reason || null,
          feedback: feedback || null,
        });
      }

      try {
        await sendCancellationConfirmedEmail(household.email, household.name);
      } catch (emailErr) {
        console.error("Failed to send cancellation email:", emailErr);
      }

      res.json({ success: true, message: "Subscription will be canceled at period end" });
    } catch (error: any) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  app.get("/api/subscription/status", requireSessionAuth, async (req: Request, res: Response) => {
    try {
      const sessionReq = req as SessionAuthRequest;
      const householdId = sessionReq.sessionHouseholdId;

      if (!householdId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const households = await db
        .select({
          subscriptionTier: householdsTable.subscriptionTier,
          billingInterval: householdsTable.billingInterval,
          subscriptionStatus: householdsTable.subscriptionStatus,
          trialStartsAt: householdsTable.trialStartsAt,
          trialEndsAt: householdsTable.trialEndsAt,
          cancelAtPeriodEnd: householdsTable.cancelAtPeriodEnd,
          gracePeriodEndsAt: householdsTable.gracePeriodEndsAt,
          stripeCustomerId: householdsTable.stripeCustomerId,
        })
        .from(householdsTable)
        .where(eq(householdsTable.id, householdId))
        .limit(1);

      if (households.length === 0) {
        return res.status(404).json({ error: "Household not found" });
      }

      const h = households[0];

      const now = new Date();
      let daysRemaining: number | null = null;
      if (h.subscriptionStatus === 'trialing' && h.trialEndsAt) {
        daysRemaining = Math.max(0, Math.ceil((h.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      let graceDaysRemaining: number | null = null;
      if (h.subscriptionStatus === 'past_due' && h.gracePeriodEndsAt) {
        graceDaysRemaining = Math.max(0, Math.ceil((h.gracePeriodEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      res.json({
        tier: h.subscriptionTier,
        billingInterval: h.billingInterval,
        status: h.subscriptionStatus,
        trialDaysRemaining: daysRemaining,
        graceDaysRemaining,
        cancelAtPeriodEnd: h.cancelAtPeriodEnd,
        hasPaymentMethod: !!h.stripeCustomerId,
      });
    } catch (error: any) {
      console.error("Get subscription status error:", error);
      res.status(500).json({ error: "Failed to get subscription status" });
    }
  });

  app.get("/api/subscription/feature/:featureKey", requireSessionAuth, async (req: Request, res: Response) => {
    try {
      const sessionReq = req as SessionAuthRequest;
      const householdId = sessionReq.sessionHouseholdId;
      const { featureKey } = req.params;

      if (!householdId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const result = await checkFeatureAccess(householdId, featureKey);
      res.json(result);
    } catch (error: any) {
      console.error("Feature check error:", error);
      res.status(500).json({ error: "Failed to check feature access" });
    }
  });

  app.post("/api/subscription/create-checkout", express.json(), async (req: Request, res: Response) => {
    try {
      const { billingInterval, email, name } = req.body;

      if (!billingInterval) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!stripe) {
        return res.status(500).json({ error: "Payment system not configured" });
      }

      const priceId = billingInterval === 'monthly' ? MONTHLY_PRICE_ID : ANNUAL_PRICE_ID;
      const baseUrl = process.env.PUBLIC_BASE_URL || `https://${req.get('host')}`;

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          trial_period_days: TRIAL_DAYS,
          metadata: {
            canonical_email: canonicalizeEmail(email),
            billing_interval: billingInterval,
          },
        },
        customer_email: email.toLowerCase(),
        success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing`,
        metadata: {
          signup_type: 'subscription',
          billing_interval: billingInterval,
          customer_name: name || '',
        },
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (error: any) {
      console.error("Create checkout error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/subscription/billing-portal", requireSessionAuth, express.json(), async (req: Request, res: Response) => {
    try {
      const sessionReq = req as SessionAuthRequest;
      const householdId = sessionReq.sessionHouseholdId;

      if (!householdId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const households = await db
        .select({ stripeCustomerId: householdsTable.stripeCustomerId })
        .from(householdsTable)
        .where(eq(householdsTable.id, householdId))
        .limit(1);

      if (!households[0]?.stripeCustomerId) {
        return res.status(400).json({ error: "No billing account found" });
      }

      if (!stripe) {
        return res.status(500).json({ error: "Payment system not configured" });
      }

      const baseUrl = process.env.PUBLIC_BASE_URL || `https://${req.get('host')}`;

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: households[0].stripeCustomerId,
        return_url: `${baseUrl}/settings/billing`,
      });

      res.json({ url: portalSession.url });
    } catch (error: any) {
      console.error("Billing portal error:", error);
      res.status(500).json({ error: "Failed to create billing portal session" });
    }
  });
}

export function registerSubscriptionWebhookHandler(app: Express) {

  app.post("/api/stripe/subscription-webhook", express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret || !stripe) {
      return res.status(400).json({ error: "Webhook not configured" });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("Subscription webhook signature verification failed:", err.message);
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const existing = await db
      .select({ id: subscriptionEventsTable.id })
      .from(subscriptionEventsTable)
      .where(eq(subscriptionEventsTable.stripeEventId, event.id))
      .limit(1);

    if (existing.length > 0) {
      return res.json({ received: true, duplicate: true });
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          const household = await getHouseholdByStripeCustomerId(subscription.customer as string);
          
          if (household) {
            const statusBefore = household.subscriptionStatus;
            await db.update(householdsTable).set({
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              updatedAt: new Date(),
            }).where(eq(householdsTable.id, household.id));

            await logSubscriptionEvent(
              household.id,
              event.type,
              event.id,
              statusBefore,
              subscription.status,
              { subscriptionId: subscription.id }
            );
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const household = await getHouseholdByStripeSubscriptionId(subscription.id);

          if (household) {
            const statusBefore = household.subscriptionStatus;
            const updateData: Record<string, any> = {
              subscriptionStatus: subscription.status,
              updatedAt: new Date(),
            };

            if (subscription.cancel_at_period_end) {
              updateData.cancelAtPeriodEnd = true;
            }

            await db.update(householdsTable).set(updateData)
              .where(eq(householdsTable.id, household.id));

            if (subscription.status === 'active' && statusBefore === 'trialing') {
              const nextBilling = subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : new Date();
              try {
                await sendSubscriptionActiveEmail(
                  household.email,
                  household.name,
                  household.billingInterval || 'monthly',
                  nextBilling
                );
              } catch (emailErr) {
                console.error("Failed to send subscription active email:", emailErr);
              }
            }

            await logSubscriptionEvent(
              household.id,
              event.type,
              event.id,
              statusBefore,
              subscription.status,
              { cancelAtPeriodEnd: subscription.cancel_at_period_end }
            );
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const household = await getHouseholdByStripeSubscriptionId(subscription.id);

          if (household) {
            const statusBefore = household.subscriptionStatus;
            await db.update(householdsTable).set({
              subscriptionStatus: 'canceled',
              canceledAt: new Date(),
              updatedAt: new Date(),
            }).where(eq(householdsTable.id, household.id));

            try {
              await sendCancellationConfirmedEmail(household.email, household.name);
            } catch (emailErr) {
              console.error("Failed to send cancellation email:", emailErr);
            }

            await logSubscriptionEvent(
              household.id,
              event.type,
              event.id,
              statusBefore,
              'canceled'
            );
          }
          break;
        }

        case 'customer.subscription.trial_will_end': {
          const subscription = event.data.object as Stripe.Subscription;
          const household = await getHouseholdByStripeSubscriptionId(subscription.id);

          if (household && household.trialEndsAt) {
            try {
              await sendPreChargeReminderEmail(
                household.email,
                household.name,
                household.trialEndsAt,
                household.billingInterval || 'monthly'
              );
              await db.insert(emailEventsTable).values({
                householdId: household.id,
                emailType: 'pre_charge_reminder',
              });
            } catch (emailErr) {
              console.error("Failed to send pre-charge reminder:", emailErr);
            }

            await logSubscriptionEvent(
              household.id,
              event.type,
              event.id,
              household.subscriptionStatus,
              household.subscriptionStatus,
              { trialEndsAt: household.trialEndsAt.toISOString() }
            );
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          const household = await getHouseholdByStripeCustomerId(invoice.customer as string);

          if (household) {
            const statusBefore = household.subscriptionStatus;
            await db.update(householdsTable).set({
              subscriptionStatus: 'active',
              gracePeriodEndsAt: null,
              firstPaymentAttemptAt: household.firstPaymentAttemptAt || new Date(),
              updatedAt: new Date(),
            }).where(eq(householdsTable.id, household.id));

            await logSubscriptionEvent(
              household.id,
              event.type,
              event.id,
              statusBefore,
              'active',
              { invoiceId: invoice.id, amount: invoice.amount_paid }
            );
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const household = await getHouseholdByStripeCustomerId(invoice.customer as string);

          if (household) {
            const statusBefore = household.subscriptionStatus;
            const gracePeriodEnd = new Date();
            gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

            await db.update(householdsTable).set({
              subscriptionStatus: 'past_due',
              gracePeriodEndsAt: gracePeriodEnd,
              updatedAt: new Date(),
            }).where(eq(householdsTable.id, household.id));

            try {
              await sendPaymentFailedEmail(household.email, household.name, gracePeriodEnd);
              await db.insert(emailEventsTable).values({
                householdId: household.id,
                emailType: 'payment_failed',
              });
            } catch (emailErr) {
              console.error("Failed to send payment failed email:", emailErr);
            }

            await logSubscriptionEvent(
              household.id,
              event.type,
              event.id,
              statusBefore,
              'past_due',
              { invoiceId: invoice.id, gracePeriodEndsAt: gracePeriodEnd.toISOString() }
            );
          }
          break;
        }

        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          if (session.metadata?.signup_type === 'subscription') {
            const customerId = session.customer as string;
            const existing = await getHouseholdByStripeCustomerId(customerId);
            
            if (!existing) {
              const email = session.customer_email || session.customer_details?.email || '';
              const name = session.metadata?.customer_name || session.customer_details?.name || 'Homeowner';
              const billingInterval = session.metadata?.billing_interval || 'monthly';
              const canonical = canonicalizeEmail(email);
              const subscriptionId = session.subscription as string;

              const trialStart = new Date();
              const trialEnd = new Date();
              trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

              const [household] = await db.insert(householdsTable).values({
                name,
                email: email.toLowerCase(),
                canonicalEmail: canonical,
                subscriptionTier: 'basic',
                billingInterval,
                subscriptionStatus: 'trialing',
                trialStartsAt: trialStart,
                trialEndsAt: trialEnd,
                trialUsed: true,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                termsAcceptedAt: new Date(),
                privacyAcceptedAt: new Date(),
                paymentAddedAt: new Date(),
                setupStatus: 'not_started',
                createdBy: 'customer',
              }).returning();

              try {
                await sendTrialWelcomeEmail(email, name, trialEnd);
                await db.insert(emailEventsTable).values({
                  householdId: household.id,
                  emailType: 'trial_welcome',
                });
              } catch (emailErr) {
                console.error("Failed to send trial welcome email:", emailErr);
              }

              await logSubscriptionEvent(
                household.id,
                event.type,
                event.id,
                null,
                'trialing',
                { sessionId: session.id, subscriptionId }
              );
            }
          }
          break;
        }

        default:
          console.log(`Unhandled subscription event type: ${event.type}`);
      }
    } catch (error: any) {
      console.error(`Error processing subscription webhook ${event.type}:`, error);
      
      await logSubscriptionEvent(
        null,
        event.type,
        event.id,
        null,
        null,
        null,
        error.message
      );
    }

    res.json({ received: true });
  });
}

export async function processGracePeriodExpirations(): Promise<number> {
  const now = new Date();

  const expired = await db
    .select({ id: householdsTable.id, email: householdsTable.email, name: householdsTable.name })
    .from(householdsTable)
    .where(
      and(
        eq(householdsTable.subscriptionStatus, 'past_due'),
        lte(householdsTable.gracePeriodEndsAt, now)
      )
    );

  for (const household of expired) {
    await db.update(householdsTable).set({
      subscriptionStatus: 'unpaid',
      updatedAt: new Date(),
    }).where(eq(householdsTable.id, household.id));

    try {
      await sendAccountSuspendedEmail(household.email, household.name);
      await db.insert(emailEventsTable).values({
        householdId: household.id,
        emailType: 'account_suspended',
      });
    } catch (emailErr) {
      console.error("Failed to send account suspended email:", emailErr);
    }
  }

  return expired.length;
}

export async function processTrialReminders(): Promise<number> {
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const startOfDay = new Date(threeDaysFromNow);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(threeDaysFromNow);
  endOfDay.setHours(23, 59, 59, 999);

  const trialsEndingSoon = await db
    .select({
      id: householdsTable.id,
      email: householdsTable.email,
      name: householdsTable.name,
      trialEndsAt: householdsTable.trialEndsAt,
      billingInterval: householdsTable.billingInterval,
    })
    .from(householdsTable)
    .where(
      and(
        eq(householdsTable.subscriptionStatus, 'trialing'),
        sql`${householdsTable.trialEndsAt} >= ${startOfDay}`,
        sql`${householdsTable.trialEndsAt} <= ${endOfDay}`
      )
    );

  let sentCount = 0;
  for (const household of trialsEndingSoon) {
    const alreadySent = await db
      .select({ id: emailEventsTable.id })
      .from(emailEventsTable)
      .where(
        and(
          eq(emailEventsTable.householdId, household.id),
          eq(emailEventsTable.emailType, 'pre_charge_reminder')
        )
      )
      .limit(1);

    if (alreadySent.length === 0 && household.trialEndsAt) {
      try {
        await sendPreChargeReminderEmail(
          household.email,
          household.name,
          household.trialEndsAt,
          household.billingInterval || 'monthly'
        );
        await db.insert(emailEventsTable).values({
          householdId: household.id,
          emailType: 'pre_charge_reminder',
        });
        sentCount++;
      } catch (emailErr) {
        console.error(`Failed to send pre-charge reminder to ${household.email}:`, emailErr);
      }
    }
  }

  return sentCount;
}
