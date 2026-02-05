import { db } from '../db';
import { householdsTable } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from './email';
import { sendSMS } from './sms';
import { storage } from '../storage';

/**
 * Notification channel types
 */
export type NotificationChannel = 'email_only' | 'sms_only' | 'both';

/**
 * Notification types (extensible for future use)
 */
export type NotificationType = 
  | 'maintenance_reminder' 
  | 'test_notification' 
  | 'welcome'
  | 'payment_confirmation'
  | 'qr_setup_reminder'
  | 'custom';

/**
 * Notification payload structure
 */
export interface NotificationPayload {
  householdId: string;           // Required: to look up preferences
  type: NotificationType;        // What kind of notification
  
  // Email-specific fields (required if channel includes email)
  emailSubject?: string;
  emailHtml?: string;
  emailText?: string;
  
  // SMS-specific fields (required if channel includes SMS)
  smsMessage?: string;
  
  // Override household preference (for test notifications)
  channelOverride?: 'email' | 'sms' | 'both';
}

/**
 * Notification result structure
 */
export interface NotificationResult {
  success: boolean;
  channelsUsed: string[];
  errors: string[];
  householdId: string;
  notificationType: NotificationType;
}

/**
 * Unified Notification Dispatcher
 * Routes notifications to email, SMS, or both based on user preferences
 */
export class NotificationDispatcher {
  
  /**
   * Send notification to household based on their preference
   */
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const { householdId, type } = payload;
    
    try {
      // Step 1: Fetch household data including preference
      const household = await this.getHousehold(householdId);
      if (!household) {
        return {
          success: false,
          channelsUsed: [],
          errors: ['Household not found'],
          householdId,
          notificationType: type
        };
      }
      
      // Step 2: Determine channel based on override or preference
      const channel = payload.channelOverride 
        ? (payload.channelOverride === 'email' ? 'email_only' : payload.channelOverride === 'sms' ? 'sms_only' : 'both')
        : (household.notificationPreference as NotificationChannel) || 'both';
      
      // Step 3: Route to appropriate channel(s)
      const result = await this.route(channel, household, payload);
      
      // Step 4: Log notification attempt
      await this.logNotification(householdId, type, channel, result);
      
      return {
        ...result,
        householdId,
        notificationType: type
      };
      
    } catch (error: any) {
      console.error('❌ NotificationDispatcher error:', {
        householdId,
        type,
        error: error.message
      });
      
      const errorResult = {
        success: false,
        channelsUsed: [],
        errors: [`Dispatcher error: ${error.message}`],
        householdId,
        notificationType: type
      };
      
      // Log the error
      await this.logNotification(householdId, type, 'both', errorResult);
      
      return errorResult;
    }
  }
  
  /**
   * Route notification to channel(s) based on preference
   */
  private async route(
    channel: NotificationChannel,
    household: any,
    payload: NotificationPayload
  ): Promise<{ success: boolean; channelsUsed: string[]; errors: string[] }> {
    
    const channelsUsed: string[] = [];
    const errors: string[] = [];
    
    // Email routing
    if (channel === 'email_only' || channel === 'both') {
      if (!payload.emailSubject || !payload.emailHtml) {
        errors.push('Email content missing for email channel');
      } else {
        const emailSent = await this.sendEmailNotification(
          household.email,
          payload.emailSubject,
          payload.emailHtml,
          payload.emailText
        );
        if (emailSent) {
          channelsUsed.push('email');
        } else {
          errors.push('Email send failed');
        }
      }
    }
    
    // SMS routing
    if (channel === 'sms_only' || channel === 'both') {
      if (!household.phone) {
        errors.push('Phone number not available for SMS');
      } else if (!payload.smsMessage) {
        errors.push('SMS message missing for SMS channel');
      } else if (!household.smsOptIn) {
        // TCPA Compliance: Do NOT send SMS if user hasn't opted in
        errors.push('User has not opted in to SMS notifications');
        console.warn(`⚠️ SMS NOT SENT: User ${household.id} has not opted in (smsOptIn=false)`);
      } else {
        const smsSent = await this.sendSMSNotification(
          household.phone,
          payload.smsMessage
        );
        if (smsSent) {
          channelsUsed.push('sms');
        } else {
          errors.push('SMS send failed');
        }
      }
    }
    
    // Determine success: at least one channel worked and no critical errors
    const success = channelsUsed.length > 0 && errors.length === 0;
    
    return {
      success,
      channelsUsed,
      errors
    };
  }
  
  /**
   * Get household from PostgreSQL database
   */
  private async getHousehold(householdId: string): Promise<any | null> {
    try {
      const household = await db.query.householdsTable.findFirst({
        where: eq(householdsTable.id, householdId)
      });
      
      return household || null;
    } catch (error: any) {
      console.error('❌ Error fetching household:', {
        householdId,
        error: error.message
      });
      return null;
    }
  }
  
  /**
   * Send email via existing email service
   */
  private async sendEmailNotification(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<boolean> {
    try {
      const from = process.env.FROM_EMAIL || 'noreply@maintcue.com';
      const result = await sendEmail({ to, from, subject, html, text });
      
      if (result) {
        console.log(`✅ Email notification sent to ${to}`);
      } else {
        console.error(`❌ Email notification failed for ${to}`);
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ Email notification error:', {
        to,
        error: error.message
      });
      return false;
    }
  }
  
  /**
   * Send SMS via existing SMS service
   */
  private async sendSMSNotification(phone: string, message: string): Promise<boolean> {
    try {
      const result = await sendSMS(phone, message);
      
      if (result) {
        console.log(`✅ SMS notification sent to ${phone}`);
      } else {
        console.error(`❌ SMS notification failed for ${phone}`);
      }
      
      return result;
    } catch (error: any) {
      console.error('❌ SMS notification error:', {
        phone,
        error: error.message
      });
      return false;
    }
  }
  
  /**
   * Log notification to events table (Firebase)
   */
  private async logNotification(
    householdId: string,
    type: NotificationType,
    channel: NotificationChannel,
    result: { success: boolean; channelsUsed: string[]; errors: string[] }
  ): Promise<void> {
    try {
      await storage.createEvent({
        householdId,
        eventType: 'notification_sent',
        eventData: JSON.stringify({
          notification_type: type,
          channel_preference: channel,
          channels_used: result.channelsUsed,
          success: result.success,
          errors: result.errors,
          timestamp: new Date().toISOString()
        })
      });
      
      console.log('✅ Notification logged to events table:', {
        householdId,
        type,
        success: result.success
      });
    } catch (error: any) {
      console.error('❌ Failed to log notification:', {
        householdId,
        type,
        error: error.message
      });
      // Don't throw - logging failure shouldn't break the notification flow
    }
  }
  
  /**
   * Update household notification preference
   * Used by SMS STOP handler
   */
  async updateNotificationPreference(
    householdId: string,
    newPreference: NotificationChannel
  ): Promise<boolean> {
    try {
      await db.update(householdsTable)
        .set({ 
          notificationPreference: newPreference,
          updatedAt: new Date()
        } as any) // Type assertion until Drizzle regenerates types
        .where(eq(householdsTable.id, householdId));
      
      console.log(`✅ Updated notification preference for ${householdId} to ${newPreference}`);
      
      // Log the preference change
      await storage.createEvent({
        householdId,
        eventType: 'preference_updated',
        eventData: JSON.stringify({
          old_preference: 'unknown', // We don't track old value for now
          new_preference: newPreference,
          timestamp: new Date().toISOString(),
          reason: 'user_request'
        })
      });
      
      return true;
    } catch (error: any) {
      console.error('❌ Failed to update notification preference:', {
        householdId,
        newPreference,
        error: error.message
      });
      return false;
    }
  }
}

// Export singleton instance
export const notificationDispatcher = new NotificationDispatcher();
