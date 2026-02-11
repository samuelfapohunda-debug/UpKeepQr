import { sendEmail } from './email.js';

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@maintcue.com';
const APP_URL = process.env.FRONTEND_URL || 'https://maintcue.com';

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
    <p style="margin: 4px 0 0 0;"><a href="${APP_URL}/terms" style="color: #6b7280;">Terms</a> | <a href="${APP_URL}/privacy" style="color: #6b7280;">Privacy</a></p>
  </div>
</body>
</html>`;
}

export async function sendTrialWelcomeEmail(email: string, name: string, trialEndsAt: Date) {
  const html = emailWrapper('Welcome to Your Free Trial', `
    <h2 style="margin-top: 0;">Hi ${name},</h2>
    <p>Welcome to MaintCue! Your <strong>30-day free trial</strong> has started.</p>
    <div style="background: #f0fdf4; border-radius: 6px; padding: 20px; margin: 20px 0; border: 1px solid #10b981;">
      <p style="margin: 0 0 8px 0; color: #059669; font-size: 16px;">[i] No charge today</p>
      <p style="margin: 0; font-size: 13px; color: #6b7280;">Your trial runs until ${formatDate(trialEndsAt)}. Cancel anytime before then and you will not be charged.</p>
    </div>
    <p><strong>Get the most from your trial:</strong></p>
    <ul style="padding-left: 20px;">
      <li>Scan your first QR code</li>
      <li>Log your first maintenance task</li>
      <li>Enable SMS reminders</li>
    </ul>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/my-home" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">Go to Your Dashboard</a>
    </div>
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
