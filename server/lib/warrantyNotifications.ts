import { db } from '../db.js';
import { 
  householdAppliancesTable, 
  householdsTable, 
  warrantyNotificationsTable,
  type HouseholdAppliance,
  type Household,
  type WarrantyNotification
} from '../../shared/schema.js';
import { eq, and, gte, lte, sql, isNull } from 'drizzle-orm';
import { sendEmail } from './email.js';
import { sendSMS } from './sms.js';

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@upkeepqr.com';
const APP_URL = process.env.FRONTEND_URL || 'https://upkeepqr.com';

interface ExpiringAppliance {
  appliance: HouseholdAppliance;
  household: Household;
  daysUntilExpiration: number;
}

interface NotificationResult {
  applianceId: string;
  notificationType: string;
  emailSent: boolean;
  smsSent: boolean;
  error?: string;
}

export async function processWarrantyExpirationNotifications(): Promise<{
  processed: number;
  emailsSent: number;
  smsSent: number;
  errors: number;
}> {
  console.log('🔔 Starting warranty expiration notification processing...');
  
  let processed = 0;
  let emailsSent = 0;
  let smsSent = 0;
  let errors = 0;

  try {
    const sevenDayAppliances = await getExpiringAppliances(7);
    const threeDayAppliances = await getExpiringAppliances(3);

    console.log(`Found ${sevenDayAppliances.length} appliances expiring in 7 days`);
    console.log(`Found ${threeDayAppliances.length} appliances expiring in 3 days`);

    for (const item of sevenDayAppliances) {
      const result = await sendWarrantyNotification(item, '7_day');
      processed++;
      if (result.emailSent) emailsSent++;
      if (result.smsSent) smsSent++;
      if (result.error) errors++;
    }

    for (const item of threeDayAppliances) {
      const result = await sendWarrantyNotification(item, '3_day');
      processed++;
      if (result.emailSent) emailsSent++;
      if (result.smsSent) smsSent++;
      if (result.error) errors++;
    }

    console.log(`✅ Warranty notifications complete: ${processed} processed, ${emailsSent} emails, ${smsSent} SMS, ${errors} errors`);
  } catch (error) {
    console.error('❌ Warranty notification processing failed:', error);
    throw error;
  }

  return { processed, emailsSent, smsSent, errors };
}

async function getExpiringAppliances(daysFromNow: number): Promise<ExpiringAppliance[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() + daysFromNow);
  
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const notificationType = daysFromNow === 7 ? '7_day' : '3_day';

  const results = await db
    .select({
      appliance: householdAppliancesTable,
      household: householdsTable
    })
    .from(householdAppliancesTable)
    .innerJoin(
      householdsTable,
      eq(householdAppliancesTable.householdId, householdsTable.id)
    )
    .leftJoin(
      warrantyNotificationsTable,
      and(
        eq(warrantyNotificationsTable.householdApplianceId, householdAppliancesTable.id),
        eq(warrantyNotificationsTable.notificationType, notificationType)
      )
    )
    .where(
      and(
        eq(householdAppliancesTable.isActive, true),
        gte(householdAppliancesTable.warrantyExpiration, targetDate),
        lte(householdAppliancesTable.warrantyExpiration, nextDay),
        isNull(warrantyNotificationsTable.id)
      )
    );

  return results.map(r => ({
    appliance: r.appliance,
    household: r.household,
    daysUntilExpiration: daysFromNow
  }));
}

async function sendWarrantyNotification(
  item: ExpiringAppliance, 
  notificationType: '7_day' | '3_day'
): Promise<NotificationResult> {
  const { appliance, household, daysUntilExpiration } = item;
  
  const result: NotificationResult = {
    applianceId: appliance.id,
    notificationType,
    emailSent: false,
    smsSent: false
  };

  const notificationMethod = household.notificationPreference || 'email_only';
  const shouldSendEmail = notificationMethod === 'email_only' || notificationMethod === 'both';
  const shouldSendSMS = (notificationMethod === 'sms_only' || notificationMethod === 'both') && 
                         household.smsOptIn && 
                         household.phone;

  try {
    const [notification] = await db.insert(warrantyNotificationsTable).values({
      householdApplianceId: appliance.id,
      householdId: household.id,
      notificationType,
      notificationMethod,
      status: 'pending'
    }).returning();

    if (shouldSendEmail) {
      try {
        const emailSuccess = await sendWarrantyEmail(household, appliance, daysUntilExpiration, notificationType);
        if (emailSuccess) {
          result.emailSent = true;
          await db.update(warrantyNotificationsTable)
            .set({ 
              emailSent: true, 
              emailSentAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(warrantyNotificationsTable.id, notification.id));
        }
      } catch (emailError: any) {
        console.error(`Email failed for appliance ${appliance.id}:`, emailError.message);
        result.error = emailError.message;
      }
    }

    if (shouldSendSMS && household.phone) {
      try {
        const smsSuccess = await sendWarrantySMS(household, appliance, daysUntilExpiration, notificationType);
        if (smsSuccess) {
          result.smsSent = true;
          await db.update(warrantyNotificationsTable)
            .set({ 
              smsSent: true, 
              smsSentAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(warrantyNotificationsTable.id, notification.id));
        }
      } catch (smsError: any) {
        console.error(`SMS failed for appliance ${appliance.id}:`, smsError.message);
        result.error = (result.error ? result.error + '; ' : '') + smsError.message;
      }
    }

    const finalStatus = result.emailSent || result.smsSent 
      ? (result.error ? 'partial' : 'sent') 
      : 'failed';

    await db.update(warrantyNotificationsTable)
      .set({ 
        status: finalStatus,
        errorMessage: result.error || null,
        updatedAt: new Date()
      })
      .where(eq(warrantyNotificationsTable.id, notification.id));

  } catch (error: any) {
    console.error(`Failed to create notification record for appliance ${appliance.id}:`, error.message);
    result.error = error.message;
  }

  return result;
}

async function sendWarrantyEmail(
  household: Household,
  appliance: HouseholdAppliance,
  daysUntilExpiration: number,
  notificationType: '7_day' | '3_day'
): Promise<boolean> {
  const urgency = notificationType === '3_day' ? 'high' : 'medium';
  const urgencyColor = notificationType === '3_day' ? '#dc2626' : '#f59e0b';
  const urgencyText = notificationType === '3_day' ? 'URGENT: ' : '';
  const alertIcon = notificationType === '3_day' ? '[!]' : '[i]';
  
  const expirationDate = appliance.warrantyExpiration 
    ? new Date(appliance.warrantyExpiration).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Unknown';

  const subject = `${urgencyText}Your ${appliance.applianceType} Warranty Expires in ${daysUntilExpiration} Days`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">UpKeepQR</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Warranty Expiration Alert</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none;">
    <div style="background: ${urgencyColor}15; border-left: 4px solid ${urgencyColor}; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: ${urgencyColor}; font-weight: 600;">
        ${alertIcon} ${notificationType === '3_day' ? 'Urgent' : 'Reminder'}: Warranty expires in ${daysUntilExpiration} days
      </p>
    </div>

    <p style="margin: 0 0 20px 0;">Hi ${household.name || 'Homeowner'},</p>
    
    <p style="margin: 0 0 20px 0;">This is a ${notificationType === '3_day' ? 'final reminder' : 'friendly reminder'} that the warranty for your <strong>${appliance.applianceType}</strong> is expiring soon.</p>
    
    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">Appliance Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Appliance:</td>
          <td style="padding: 8px 0; font-weight: 500;">${appliance.applianceType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Brand:</td>
          <td style="padding: 8px 0; font-weight: 500;">${appliance.brand}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Model:</td>
          <td style="padding: 8px 0; font-weight: 500;">${appliance.modelNumber}</td>
        </tr>
        ${appliance.warrantyProvider ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Warranty Provider:</td>
          <td style="padding: 8px 0; font-weight: 500;">${appliance.warrantyProvider}</td>
        </tr>
        ` : ''}
        ${appliance.warrantyPolicyNumber ? `
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Policy Number:</td>
          <td style="padding: 8px 0; font-weight: 500;">${appliance.warrantyPolicyNumber}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Expires On:</td>
          <td style="padding: 8px 0; font-weight: 600; color: ${urgencyColor};">${expirationDate}</td>
        </tr>
      </table>
    </div>

    <h3 style="margin: 24px 0 12px 0; color: #1f2937; font-size: 16px;">What You Should Do:</h3>
    <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
      <li style="margin-bottom: 8px;">Review your warranty coverage details</li>
      <li style="margin-bottom: 8px;">Contact the warranty provider if you have pending claims</li>
      <li style="margin-bottom: 8px;">Consider extending your warranty if available</li>
      <li style="margin-bottom: 8px;">Schedule any needed repairs before expiration</li>
    </ul>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/my-home" style="display: inline-block; background: #1e40af; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Your Dashboard</a>
    </div>

    <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px;">
      Need help finding a professional for repairs? <a href="${APP_URL}/request-pro" style="color: #1e40af;">Request a Pro</a>
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin: 0; color: #6b7280; font-size: 12px;">
      © ${new Date().getFullYear()} UpKeepQR. All rights reserved.<br>
      <a href="${APP_URL}" style="color: #1e40af;">upkeepqr.com</a>
    </p>
  </div>
</body>
</html>
  `;

  const text = `
${urgencyText}Warranty Expiration Alert

Hi ${household.name || 'Homeowner'},

This is a ${notificationType === '3_day' ? 'final reminder' : 'friendly reminder'} that the warranty for your ${appliance.applianceType} is expiring in ${daysUntilExpiration} days.

APPLIANCE DETAILS:
- Appliance: ${appliance.applianceType}
- Brand: ${appliance.brand}
- Model: ${appliance.modelNumber}
${appliance.warrantyProvider ? `- Warranty Provider: ${appliance.warrantyProvider}` : ''}
${appliance.warrantyPolicyNumber ? `- Policy Number: ${appliance.warrantyPolicyNumber}` : ''}
- Expires On: ${expirationDate}

WHAT YOU SHOULD DO:
1. Review your warranty coverage details
2. Contact the warranty provider if you have pending claims
3. Consider extending your warranty if available
4. Schedule any needed repairs before expiration

View your dashboard: ${APP_URL}/my-home

Need help? Request a Pro: ${APP_URL}/request-pro

- The UpKeepQR Team
  `;

  return await sendEmail({
    to: household.email,
    from: FROM_EMAIL,
    subject,
    html,
    text
  });
}

async function sendWarrantySMS(
  household: Household,
  appliance: HouseholdAppliance,
  daysUntilExpiration: number,
  notificationType: '7_day' | '3_day'
): Promise<boolean> {
  const urgencyPrefix = notificationType === '3_day' ? 'URGENT: ' : '';
  
  const message = `${urgencyPrefix}UpKeepQR: Your ${appliance.applianceType} warranty expires in ${daysUntilExpiration} days. Review details & schedule repairs at ${APP_URL}/my-home`;

  try {
    const result = await sendSMS(household.phone!, message);
    return result.success;
  } catch (error) {
    console.error('SMS send error:', error);
    throw error;
  }
}

export async function getWarrantyNotificationHistory(householdId: string): Promise<WarrantyNotification[]> {
  return await db
    .select()
    .from(warrantyNotificationsTable)
    .where(eq(warrantyNotificationsTable.householdId, householdId))
    .orderBy(sql`${warrantyNotificationsTable.createdAt} DESC`);
}
