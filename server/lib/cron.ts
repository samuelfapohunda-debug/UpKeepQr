import cron from 'node-cron';
import { storage } from '../storage.js';
import { db } from '../db.js';
import { householdTaskAssignmentsTable, type ReminderQueue, type Household } from '../../shared/schema.js';
import { eq, and, lt } from 'drizzle-orm';
import { sendReminderEmail } from './mail.js';
import { createMaintenanceReminderEvent } from './ics.js';

let isReminderJobRunning = false;
let isOverdueJobRunning = false;

export function startCronJobs(): void {
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily maintenance job at 09:00 EST');
    
    try {
      await updateOverdueTasks();
      await processReminderQueue();
    } catch (error) {
      console.error('Daily job failed:', error);
    }
  }, {
    timezone: 'America/New_York'
  });

  console.log('Cron jobs started successfully');
}

async function updateOverdueTasks(): Promise<void> {
  if (isOverdueJobRunning) {
    console.log('Overdue job already running, skipping');
    return;
  }
  
  isOverdueJobRunning = true;
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await db.update(householdTaskAssignmentsTable)
      .set({ 
        status: 'overdue' as const,
        updatedAt: new Date() 
      })
      .where(and(
        eq(householdTaskAssignmentsTable.status, 'pending'),
        lt(householdTaskAssignmentsTable.dueDate, today)
      ));
    
    console.log('Updated overdue tasks');
  } catch (error) {
    console.error('Failed to update overdue tasks:', error);
  } finally {
    isOverdueJobRunning = false;
  }
}

async function processReminderQueue(): Promise<void> {
  if (isReminderJobRunning) {
    console.log('Reminder job already running, skipping');
    return;
  }
  
  isReminderJobRunning = true;
  
  try {
    const now = new Date();
    const pendingReminders = await storage.getPendingReminders(now);
    
    console.log(`Processing ${pendingReminders.length} pending reminders`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const reminder of pendingReminders) {
      try {
        await processReminder(reminder);
        await storage.updateReminderStatus(reminder.id, 'sent');
        successCount++;
      } catch (error) {
        console.error(`Reminder ${reminder.id} failed:`, error);
        await storage.updateReminderStatus(
          reminder.id,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
        failCount++;
      }
    }
    
    console.log(`Processed ${successCount} reminders, ${failCount} failed`);
  } catch (error) {
    console.error('Reminder queue processing failed:', error);
  } finally {
    isReminderJobRunning = false;
  }
}

async function processReminder(reminder: ReminderQueue): Promise<void> {
  const household = await storage.getHouseholdById(reminder.householdId);
  if (!household) {
    throw new Error('Household not found');
  }
  
  const { sendEmail, sendSMS } = determineReminderChannels(household);
  
  if (!sendEmail && !sendSMS) {
    console.log(`No valid notification channels for household ${household.id}`);
    throw new Error('No valid notification channels');
  }

  let emailSent = false;
  let smsSent = false;

  if (sendEmail && household.email) {
    try {
      const icsAttachment = createMaintenanceReminderEvent(
        reminder.taskName,
        new Date(reminder.dueDate),
        reminder.taskDescription || `Complete ${reminder.taskName} maintenance task`,
        household.zipcode ? `Home in ${household.zipcode}` : undefined
      );
      
      const firstName = household.name ? household.name.split(' ')[0] : 'Homeowner';
      
      await sendReminderEmail({
        email: household.email,
        firstName: firstName,
        taskTitle: reminder.taskName,
        dueDate: new Date(reminder.dueDate).toISOString(),
        description: reminder.taskDescription || `Complete ${reminder.taskName} maintenance task`,
        howToSteps: [],
        icsAttachment: icsAttachment.toString()
      });
      
      emailSent = true;
      console.log(`Sent email reminder for ${reminder.taskName} to ${household.email}`);
    } catch (emailError) {
      console.error(`Failed to send email reminder ${reminder.id}:`, emailError);
    }
  }

  if (sendSMS && household.phone) {
    try {
      const { sendReminderSMS } = await import('./sms.js');
      await sendReminderSMS(
        household.phone,
        reminder.taskName,
        new Date(reminder.dueDate).toISOString()
      );
      
      smsSent = true;
      console.log(`Sent SMS reminder for ${reminder.taskName} to ${household.phone}`);
    } catch (smsError) {
      console.error(`Failed to send SMS reminder ${reminder.id}:`, smsError);
    }
  }

  if (!emailSent && !smsSent) {
    throw new Error('Failed to send any notifications');
  }
}

function determineReminderChannels(household: Household): {
  sendEmail: boolean;
  sendSMS: boolean;
} {
  const hasEmail = !!household.email;
  const hasPhone = !!household.phone;
  const smsEnabled = household.smsOptIn === true;
  const pref = household.notificationPreference || 'email_only';
  
  let sendEmail = false;
  let sendSMS = false;
  
  if (pref === 'email_only' && hasEmail) {
    sendEmail = true;
  } else if (pref === 'sms_only' && hasPhone && smsEnabled) {
    sendSMS = true;
  } else if (pref === 'both') {
    if (hasEmail) sendEmail = true;
    if (hasPhone && smsEnabled) sendSMS = true;
  } else {
    if (hasEmail) sendEmail = true;
  }
  
  return { sendEmail, sendSMS };
}

export async function triggerReminderProcessing(): Promise<void> {
  console.log('Manually triggering reminder processing');
  await processReminderQueue();
}

export async function triggerOverdueUpdate(): Promise<void> {
  console.log('Manually triggering overdue task update');
  await updateOverdueTasks();
}
