import { sendEmail } from './email.js';
import { generateMagicLink } from './magicLink.js';

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@maintcue.com';
const APP_URL = process.env.PUBLIC_BASE_URL || process.env.FRONTEND_URL || 'https://maintcue.com';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function emailWrapper(title: string, content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <span style="font-size: 32px; font-weight: 700; color: #fff;">Maint</span><span style="font-size: 32px; font-weight: 700; color: #1E3A5F;">Cue</span>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">${title}</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    ${content}
  </div>
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; color: #6b7280; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
    <p style="margin: 4px 0 0 0;"><a href="https://maintcue.com/terms-of-service" style="color: #6b7280;">Terms</a> | <a href="https://maintcue.com/privacy-policy" style="color: #6b7280;">Privacy</a></p>
  </div>
</body>
</html>`;
}

export async function sendTrialWelcomeEmail(email: string, name: string, trialEndsAt: Date, planDisplayName?: string) {
  const isRealtor = planDisplayName === 'Realtor / Agent';
  const gettingStartedItems = isRealtor
    ? ['Add your first client', 'Set up your agent dashboard', 'Invite your first homeowner']
    : ['Activate Your Service', 'Explore your maintenance dashboard', 'Enable maintenance alerts'];

  const html = emailWrapper('Welcome to Your Free Trial', `
    <h2 style="margin-top: 0;">Hi ${name},</h2>
    <p>Welcome to MaintCue! Your <strong>30-day free trial</strong> has started.</p>
    <div style="background: #f0fdf4; border-radius: 6px; padding: 20px; margin: 20px 0; border: 1px solid #10b981;">
      <p style="margin: 0 0 8px 0; color: #059669; font-size: 16px;">[i] No charge today</p>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">Your trial runs until ${formatDate(trialEndsAt)}. Cancel anytime before then and you will not be charged.</p>
    </div>
    <p><strong>Get the most from your trial:</strong></p>
    <ul style="padding-left: 20px;">
      ${gettingStartedItems.map(item => `<li>${item}</li>`).join('\n      ')}
    </ul>
  `);

  return sendEmail({
    to: email,
    from: FROM_EMAIL,
    subject: 'Your MaintCue free trial has started',
    html,
    text: `Hi ${name}, your 30-day free trial has started. Trial runs until ${formatDate(trialEndsAt)}. Visit ${APP_URL}/my-home to get started.`
  });
}

export async function sendPreChargeReminderEmail(email: string, name: string, trialEndsAt: Date, billingInterval: string) {
  const chargeAmount = billingInterval === 'monthly' ? '$9.99' : '$83.88';
  const plan = billingInterval === 'monthly' ? 'Monthly' : 'Annual';

  const html = emailWrapper('Your Trial Ends Soon', `
    <h2 style="margin-top: 0;">Hi ${name},</h2>
    <p>Your 30-day MaintCue trial ends in <strong>3 days</strong> (${formatDate(trialEndsAt)}).</p>
    <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0;">What happens next:</h3>
      <p style="margin: 0;">On ${formatDate(trialEndsAt)}, we will automatically charge your card on file:</p>
      <p style="font-size: 24px; font-weight: bold; margin: 10px 0; color: #059669;">${chargeAmount}</p>
      <p style="margin: 0;">Plan: MaintCue ${plan}</p>
    </div>
    <p><strong>Want to continue?</strong> No action needed -- you are all set.</p>
    <p><strong>Need to make changes?</strong> Update your plan or cancel anytime:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/settings/billing" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">Manage My Subscription</a>
    </div>
    <p style="font-size: 14px; color: #6b7280;"><strong>You will not be charged today.</strong> This is a courtesy reminder 3 days before your first charge.</p>
  `);

  return sendEmail({
    to: email,
    from: FROM_EMAIL,
    subject: `Your MaintCue subscription starts in 3 days (${chargeAmount})`,
    html,
    text: `Hi ${name}, your trial ends ${formatDate(trialEndsAt)}. You will be charged ${chargeAmount} for MaintCue ${plan}. Manage at ${APP_URL}/settings/billing`
  });
}

export async function sendPaymentFailedEmail(email: string, name: string, gracePeriodEnd: Date) {
  const html = emailWrapper('Payment Issue', `
    <h2 style="margin-top: 0;">Hi ${name},</h2>
    <p>We were unable to process your payment for MaintCue.</p>
    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0;">[!] Action Required</h3>
      <p style="margin: 0;">Please update your payment method by <strong>${formatDate(gracePeriodEnd)}</strong> to keep your account active.</p>
    </div>
    <p>Your account will remain fully functional during this grace period. After that, access will be paused until payment is resolved.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/settings/billing" style="display: inline-block; background: #ef4444; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">Update Payment Method</a>
    </div>
  `);

  return sendEmail({
    to: email,
    from: FROM_EMAIL,
    subject: '[!] MaintCue - Payment issue needs your attention',
    html,
    text: `Hi ${name}, we could not process your payment. Update your payment method by ${formatDate(gracePeriodEnd)} at ${APP_URL}/settings/billing`
  });
}

export async function sendSubscriptionActiveEmail(email: string, name: string, billingInterval: string, nextBillingDate: Date) {
  const html = emailWrapper('Subscription Active', `
    <h2 style="margin-top: 0;">Hi ${name},</h2>
    <p>Your MaintCue subscription is now active. Thank you for subscribing!</p>
    <div style="background: #f0fdf4; border-radius: 6px; padding: 20px; margin: 20px 0; border: 1px solid #10b981;">
      <p style="margin: 0;"><strong>Plan:</strong> MaintCue ${billingInterval === 'monthly' ? 'Monthly' : 'Annual'}</p>
      <p style="margin: 8px 0 0 0;"><strong>Next billing date:</strong> ${formatDate(nextBillingDate)}</p>
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/my-home" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">Go to Dashboard</a>
    </div>
  `);

  return sendEmail({
    to: email,
    from: FROM_EMAIL,
    subject: 'Your MaintCue subscription is active',
    html,
    text: `Hi ${name}, your MaintCue subscription is now active. Next billing: ${formatDate(nextBillingDate)}. Visit ${APP_URL}/my-home`
  });
}

export async function sendCancellationConfirmedEmail(email: string, name: string) {
  const html = emailWrapper('Subscription Canceled', `
    <h2 style="margin-top: 0;">Hi ${name},</h2>
    <p>Your MaintCue subscription has been canceled as requested.</p>
    <p>We are sorry to see you go. If you change your mind, you can resubscribe anytime.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/pricing" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">Resubscribe</a>
    </div>
    <p style="font-size: 14px; color: #6b7280;">If you have feedback on how we can improve, we would love to hear from you at support@maintcue.com.</p>
  `);

  return sendEmail({
    to: email,
    from: FROM_EMAIL,
    subject: 'Your MaintCue subscription has been canceled',
    html,
    text: `Hi ${name}, your MaintCue subscription has been canceled. Resubscribe anytime at ${APP_URL}/pricing`
  });
}

export async function sendAccountSuspendedEmail(email: string, name: string) {
  const html = emailWrapper('Account Paused', `
    <h2 style="margin-top: 0;">Hi ${name},</h2>
    <p>Your MaintCue account has been paused because we were unable to collect payment after multiple attempts.</p>
    <p>To restore access to your maintenance dashboard, please update your payment method:</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/pricing" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">Reactivate Account</a>
    </div>
    <p style="font-size: 14px; color: #6b7280;">Your data has been saved and will be available when you reactivate.</p>
  `);

  return sendEmail({
    to: email,
    from: FROM_EMAIL,
    subject: '[!] Your MaintCue account has been paused',
    html,
    text: `Hi ${name}, your MaintCue account has been paused due to payment issues. Reactivate at ${APP_URL}/pricing`
  });
}

export async function sendSubscriptionWelcomeEmail(
  email: string,
  name: string,
  planName: string,
  amountPaid: string,
  orderId: string | undefined,
  qrCodes: Array<{ code: string; qrUrl: string; setupUrl: string }>
) {
  const qrSection = qrCodes.length > 0 ? `
    <div style="background: #f0fdf4; border-radius: 6px; padding: 20px; margin: 20px 0; border: 1px solid #10b981;">
      <p style="margin: 0 0 8px 0; color: #059669; font-size: 16px; font-weight: 600;">[i] Your QR Code${qrCodes.length > 1 ? 's' : ''}</p>
      <p style="margin: 0 0 12px 0;">You have <strong>${qrCodes.length} QR code${qrCodes.length > 1 ? 's' : ''}</strong> ready to use with your ${planName} plan.</p>
      ${qrCodes.length <= 5 ? qrCodes.map((qr, i) => `
        <div style="background: #fff; border-radius: 4px; padding: 12px; margin: 8px 0; border: 1px solid #d1fae5;">
          <p style="margin: 0; font-size: 13px;"><strong>Code ${i + 1}:</strong> ${qr.code}</p>
          <div style="margin: 8px 0 0 0;">
            <a href="${qr.setupUrl}" style="display: inline-block; background: #10b981; color: white; padding: 8px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px;">Activate</a>
          </div>
        </div>
      `).join('') : `
        <p style="margin: 0; font-size: 13px;">Your ${qrCodes.length} QR codes are attached to your order${orderId ? ` (${orderId})` : ''} and ready for activation.</p>
      `}
    </div>
  ` : '';

  const html = emailWrapper('Welcome to MaintCue', `
    <h2 style="margin-top: 0;">Hi ${name},</h2>
    <p>Thank you for subscribing to the <strong>${planName}</strong> plan!</p>
    <div style="background: #f8fafc; border-radius: 6px; padding: 16px; margin: 16px 0; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 8px 0;"><strong>Plan:</strong> ${planName}</p>
      ${orderId ? `<p style="margin: 0 0 8px 0;"><strong>Order:</strong> ${orderId}</p>` : ''}
      <p style="margin: 0;"><strong>Amount:</strong> $${amountPaid}</p>
    </div>
    ${qrSection}
    <p style="font-size: 14px; color: #6b7280;">Questions? Reply to this email and we will help you get started.</p>
  `);

  return sendEmail({
    to: email,
    from: FROM_EMAIL,
    subject: `Welcome to MaintCue - ${planName} Plan`,
    html,
    text: `Hi ${name}, welcome to MaintCue! Your ${planName} plan is active. You have ${qrCodes.length} QR code(s). Visit ${APP_URL}/my-home to get started.`
  });
}

export async function sendPropertyManagerWelcomeEmail(
  email: string,
  name: string,
  amountPaid: string,
  orderId: string | undefined
) {
  const html = emailWrapper('Your Property Manager Portfolio is Ready', `
    <h2 style="margin-top: 0;">Hi ${name},</h2>
    <p>Welcome to MaintCue! Your <strong>Property Manager</strong> portfolio is set up and ready to activate.</p>

    <div style="background: #f8fafc; border-radius: 6px; padding: 16px; margin: 16px 0; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 8px 0;"><strong>Plan:</strong> Property Manager</p>
      <p style="margin: 0 0 8px 0;"><strong>Portfolio capacity:</strong> 200 properties</p>
      ${orderId ? `<p style="margin: 0 0 8px 0;"><strong>Order:</strong> ${orderId}</p>` : ''}
      <p style="margin: 0;"><strong>Billing:</strong> $1,788/year</p>
    </div>

    <div style="background: #f0fdf4; border-radius: 6px; padding: 20px; margin: 20px 0; border: 1px solid #10b981;">
      <p style="margin: 0 0 12px 0; color: #059669; font-size: 15px; font-weight: 600;">What's included in your plan:</p>
      <ul style="margin: 0; padding-left: 20px; color: #374151;">
        <li style="margin-bottom: 8px;">AI-generated maintenance schedules per property</li>
        <li style="margin-bottom: 8px;">Climate-specific seasonal task recommendations</li>
        <li style="margin-bottom: 8px;">Cost estimates for upcoming maintenance tasks</li>
        <li style="margin-bottom: 0;">Preventive alerts before issues escalate</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${APP_URL}/property-manager" style="display: inline-block; background: #10b981; color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Activate Your Portfolio</a>
    </div>

    <div style="background: #f8fafc; border-radius: 6px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 10px 0; font-weight: 600;">Getting started:</p>
      <ol style="margin: 0; padding-left: 20px; color: #374151;">
        <li style="margin-bottom: 8px;">Click <strong>Activate Your Portfolio</strong> above</li>
        <li style="margin-bottom: 8px;">Add a property manually or bulk upload your units</li>
        <li style="margin-bottom: 0;">Your AI maintenance schedule generates automatically</li>
      </ol>
    </div>

    <p style="font-size: 14px; color: #6b7280;">Questions? Reply to this email and we will help you get set up.</p>
  `);

  return sendEmail({
    to: email,
    from: FROM_EMAIL,
    subject: 'Welcome to MaintCue — Your Property Manager Portfolio is Ready',
    html,
    text: `Hi ${name}, welcome to MaintCue! Your Property Manager portfolio (200 properties) is ready. Billing: $1,788/year. Activate at ${APP_URL}/property-manager`
  });
}

// ── Realtor: subscription welcome email with magic link ──────────────────────
export async function sendRealtorWelcomeEmail(
  email: string,
  name: string,
  orderId: string | undefined,
  amountPaid: string,
  householdId: string,
) {
  const magicLink = await generateMagicLink(email, householdId);

  const html = emailWrapper('Your Realtor Dashboard is Ready', `
    <h2 style="margin-top: 0;">Hi ${name},</h2>
    <p>Thank you for subscribing to the <strong>Realtor / Agent</strong> plan!</p>

    <div style="background: #f8fafc; border-radius: 6px; padding: 16px; margin: 16px 0; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 8px 0;"><strong>Plan:</strong> Realtor / Agent</p>
      ${orderId ? `<p style="margin: 0 0 8px 0;"><strong>Order:</strong> ${orderId}</p>` : ''}
      <p style="margin: 0 0 8px 0;"><strong>Client Slots:</strong> 25 homeowners</p>
      <p style="margin: 0;"><strong>Billing:</strong> $468/year</p>
    </div>

    <div style="background: #f0fdf4; border-radius: 6px; padding: 20px; margin: 20px 0; border: 1px solid #10b981;">
      <p style="margin: 0 0 10px 0; color: #059669; font-size: 15px; font-weight: 600;">🏠 Start Adding Your Clients</p>
      <p style="margin: 0; color: #374151;">You can now add up to 25 homeowner clients. Each client gets their own AI-generated maintenance schedule and personalized task reminders.</p>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${magicLink}" style="display: inline-block; background: #10b981; color: white; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Access Your Dashboard →</a>
    </div>

    <div style="background: #f8fafc; border-radius: 6px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 10px 0; font-weight: 600;">Getting started:</p>
      <ol style="margin: 0; padding-left: 20px; color: #374151;">
        <li style="margin-bottom: 8px;">Click <strong>Access Your Dashboard</strong> above</li>
        <li style="margin-bottom: 8px;">Add your first client (name, email, property address)</li>
        <li style="margin-bottom: 0;">Client receives their personalized maintenance schedule</li>
      </ol>
    </div>

    <p style="font-size: 13px; color: #6b7280;">This link expires in 24 hours. Questions? Reply to this email and we will help you get started.</p>
  `);

  return sendEmail({
    to: email,
    from: FROM_EMAIL,
    subject: 'Welcome to MaintCue — Your Realtor Dashboard is Ready',
    html,
    text: `Hi ${name}, welcome to MaintCue! Your Realtor / Agent plan is active (25 client slots, $468/year). Access your dashboard: ${magicLink}`,
  });
}

export async function sendAdminSubscriptionNotification(
  customerEmail: string,
  customerName: string,
  planName: string,
  amountPaid: string,
  subscriptionId: string,
  qrCodeCount: number
) {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@maintcue.com';

  const html = emailWrapper('New Subscription', `
    <h2 style="margin-top: 0;">New Subscription Created</h2>
    <div style="background: #f8fafc; border-radius: 6px; padding: 16px; margin: 16px 0; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 8px 0;"><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
      <p style="margin: 0 0 8px 0;"><strong>Plan:</strong> ${planName}</p>
      <p style="margin: 0 0 8px 0;"><strong>Amount:</strong> $${amountPaid}</p>
      <p style="margin: 0 0 8px 0;"><strong>QR Codes:</strong> ${qrCodeCount}</p>
      <p style="margin: 0;"><strong>Subscription ID:</strong> ${subscriptionId}</p>
    </div>
  `);

  return sendEmail({
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    subject: `[Admin] New subscription: ${customerName} - ${planName}`,
    html,
    text: `New subscription: ${customerName} (${customerEmail}), plan: ${planName}, amount: $${amountPaid}, QR codes: ${qrCodeCount}, subscription: ${subscriptionId}`
  });
}

// ── Realtor: client invitation email ────────────────────────────────────────
export async function sendRealtorClientActivationEmail(
  clientEmail: string,
  clientName: string,
  realtorName: string,
  propertyAddress: string,
  activationUrl: string,
) {
  const html = emailWrapper(`Your Home Maintenance Schedule — from ${realtorName}`, `
    <h2 style="margin-top: 0;">Hi ${clientName},</h2>
    <p><strong>${realtorName}</strong> has set up a personalized home maintenance schedule for your property at <strong>${propertyAddress}</strong>.</p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${activationUrl}" style="background: #2563eb; color: #fff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
        Set Up Your Account →
      </a>
    </div>

    <div style="background: #f0fdf4; border-radius: 6px; padding: 20px; margin: 20px 0; border: 1px solid #10b981;">
      <p style="margin: 0 0 10px 0; color: #059669; font-weight: 600;">Your schedule includes:</p>
      <ul style="margin: 0; padding-left: 20px; color: #374151;">
        <li style="margin-bottom: 6px;">✅ AI-generated 12-month maintenance plan</li>
        <li style="margin-bottom: 6px;">✅ Climate-specific task recommendations</li>
        <li style="margin-bottom: 6px;">✅ Cost estimates for every task</li>
        <li style="margin-bottom: 0;">✅ Preventive maintenance alerts</li>
      </ul>
    </div>

    <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
      Powered by MaintCue · Provided by ${realtorName}
    </p>
  `);

  return sendEmail({
    to: clientEmail,
    from: FROM_EMAIL,
    subject: `Your Home Maintenance Schedule is Ready — from ${realtorName}`,
    html,
    text: `Hi ${clientName}, ${realtorName} has set up a home maintenance schedule for ${propertyAddress}. Set up your account: ${activationUrl}`,
  });
}

// ── Realtor: client welcome + magic link email ───────────────────────────────
export async function sendRealtorClientWelcomeEmail(
  clientEmail: string,
  clientName: string,
  realtorName: string,
  propertyAddress: string,
  magicLink: string,
) {
  const html = emailWrapper('Your MaintCue Account is Ready', `
    <h2 style="margin-top: 0;">Hi ${clientName},</h2>
    <p>Your home maintenance account has been created! Your personalised schedule for <strong>${propertyAddress}</strong> is now generating.</p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${magicLink}" style="background: #10b981; color: #fff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
        Go to My Dashboard →
      </a>
    </div>

    <div style="background: #f8fafc; border-radius: 6px; padding: 16px; margin: 16px 0; border: 1px solid #e2e8f0;">
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280;"><strong>Note:</strong> This link expires in 24 hours. Use it to log in and access your dashboard.</p>
    </div>

    <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
      Powered by MaintCue · Provided by ${realtorName}
    </p>
  `);

  return sendEmail({
    to: clientEmail,
    from: FROM_EMAIL,
    subject: 'Your MaintCue account is ready — access your maintenance dashboard',
    html,
    text: `Hi ${clientName}, your MaintCue account is ready. Access your dashboard: ${magicLink}. Provided by ${realtorName}.`,
  });
}
