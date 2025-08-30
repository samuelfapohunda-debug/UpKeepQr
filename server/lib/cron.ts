import cron from 'node-cron';
import { storage } from '../storage';
import { sendReminderEmail, getTaskHowToSteps } from './mail';
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
  if (!household || !household.email) {
    console.log(`⚠️ Skipping reminder ${reminder.id}: No email for household`);
    await storage.updateReminderStatus(reminder.id, 'failed');
    return;
  }

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
  
  // Mark as sent
  await storage.updateReminderStatus(reminder.id, 'sent');
  
  // Create event record
  await storage.createEvent({
    householdId: reminder.householdId,
    eventType: 'reminder_sent',
    eventData: JSON.stringify({
      reminderId: reminder.id,
      taskName: reminder.taskName,
      dueDate: reminder.dueDate,
      sentAt: new Date().toISOString()
    })
  });
  
  console.log(`✅ Sent reminder for ${reminder.taskName} to ${household.email}`);
}

/**
 * Manual trigger for testing (can be called from API endpoint)
 */
export async function triggerReminderProcessing(): Promise<void> {
  console.log('🔄 Manually triggering reminder processing');
  await processReminderQueue();
}