import cron from 'node-cron';
import { storage } from '../storage';
import { sendReminderEmail } from './mail';
import { createMaintenanceReminderEvent } from './ics';

/**
 * Start all cron jobs
 */
export function startCronJobs(): void {
  // Daily job at 09:00 local time to process reminder queue
  cron.schedule('0 9 * * *', async () => {
    console.log('🕘 Running daily reminder job at 09:00');
    await processReminderQueue();
  }, {
    timezone: 'America/New_York' // Default timezone, can be made configurable
  });

  console.log('✅ Cron jobs started successfully');
}

/**
 * Process pending reminders in the queue
 */
async function processReminderQueue(): Promise<void> {
  try {
    const now = new Date();
    
    // Fetch pending reminders where run_at <= now
    const pendingReminders = await storage.getPendingReminders(now);
    
    console.log(`📧 Processing ${pendingReminders.length} pending reminders`);
    
    for (const reminder of pendingReminders) {
      try {
        await processReminder(reminder);
      } catch (error) {
        console.error(`❌ Failed to process reminder ${reminder.id}:`, error);
        
        // Mark as failed
        await storage.updateReminderStatus(reminder.id, 'failed');
      }
    }
    
    console.log('✅ Reminder queue processing completed');
  } catch (error) {
    console.error('❌ Error processing reminder queue:', error);
  }
}

/**
 * Process a single reminder
 */
async function processReminder(reminder: any): Promise<void> {
  // Get household information
  const household = await storage.getHouseholdById(reminder.householdId);
  if (!household) {
    console.log(`⚠️ Skipping reminder ${reminder.id}: Household not found`);
    await storage.updateReminderStatus(reminder.id, 'failed');
    return;
  }

  let emailSent = false;
  let smsSent = false;

  // Send email reminder if email is available
  if (household.email) {
    try {
      // Get how-to steps for the task
      const howToSteps = getTaskHowToSteps(reminder.taskName);
      
      // Create ICS calendar event
      const icsAttachment = createMaintenanceReminderEvent(
        reminder.taskName,
        new Date(reminder.dueDate),
        reminder.taskDescription || `Complete ${reminder.taskName} maintenance task`,
        household.zip ? `Home in ${household.zip}` : undefined
      );
      
      // Extract first name from email (simple approach)
      const firstName = household.email.split('@')[0].split('.')[0];
      
      // Send reminder email
      await sendReminderEmail({
        email: household.email,
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        taskTitle: reminder.taskName,
        dueDate: reminder.dueDate.toISOString(),
        description: reminder.taskDescription || `Complete ${reminder.taskName} maintenance task`,
        howToSteps,
        icsAttachment
      });
      
      emailSent = true;
      console.log(`✅ Sent email reminder for ${reminder.taskName} to ${household.email}`);
    } catch (emailError) {
      console.error(`❌ Failed to send email reminder ${reminder.id}:`, emailError);
    }
  }

  // Send SMS reminder if opted in and phone is available
  if (household.smsOptIn && household.phone) {
    try {
      const { sendReminderSMS } = await import('./sms');
      await sendReminderSMS(
        household.phone,
        reminder.taskName,
        reminder.dueDate.toISOString()
      );
      
      smsSent = true;
      console.log(`📱 Sent SMS reminder for ${reminder.taskName} to ${household.phone}`);
      
      // Create SMS sent event
      await storage.createEvent({
        householdId: reminder.householdId,
        eventType: 'sms_sent',
        eventData: JSON.stringify({
          reminderId: reminder.id,
          taskName: reminder.taskName,
          dueDate: reminder.dueDate,
          phone: household.phone,
          sentAt: new Date().toISOString()
        })
      });
    } catch (smsError) {
      console.error(`❌ Failed to send SMS reminder ${reminder.id}:`, smsError);
    }
  }

  // Mark as sent if at least one method succeeded
  if (emailSent || smsSent) {
    await storage.updateReminderStatus(reminder.id, 'sent');
    
    // Create general reminder sent event
    await storage.createEvent({
      householdId: reminder.householdId,
      eventType: 'reminder_sent',
      eventData: JSON.stringify({
        reminderId: reminder.id,
        taskName: reminder.taskName,
        dueDate: reminder.dueDate,
        emailSent,
        smsSent,
        sentAt: new Date().toISOString()
      })
    });
  } else {
    console.log(`⚠️ No valid contact method for reminder ${reminder.id}`);
    await storage.updateReminderStatus(reminder.id, 'failed');
  }
}

/**
 * Manual trigger for testing (can be called from API endpoint)
 */
export async function triggerReminderProcessing(): Promise<void> {
  console.log('🔄 Manually triggering reminder processing');
  await processReminderQueue();
}