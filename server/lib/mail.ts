import { ServerClient } from "postmark";

if (!process.env.POSTMARK_API_TOKEN) {
  throw new Error("POSTMARK_API_TOKEN environment variable is required");
}

const postmarkClient = new ServerClient(process.env.POSTMARK_API_TOKEN);

export interface WelcomeEmailData {
  email: string;
  firstName?: string;
  homeType: string;
  climateZone: string;
  taskCount: number;
  dashboardUrl: string;
}

export interface ReminderEmailData {
  email: string;
  firstName?: string;
  taskTitle: string;
  dueDate: string;
  description: string;
  howToSteps: string[];
  icsAttachment?: Buffer;
}

/**
 * Send welcome email with first tasks overview
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const { email, firstName, homeType, climateZone, taskCount, dashboardUrl } = data;
  
  const subject = `Welcome to AgentHub - Your ${homeType} maintenance is ready!`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; }
        .highlight { background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { background: #6c757d; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏠 Welcome to AgentHub!</h1>
          <p>Your home maintenance just got smarter</p>
        </div>
        
        <div class="content">
          <h2>Hi${firstName ? ` ${firstName}` : ''}! 👋</h2>
          
          <p>Congratulations! Your <strong>${homeType}</strong> is now set up with a personalized maintenance schedule optimized for your <strong>${climateZone}</strong> climate zone.</p>
          
          <div class="highlight">
            <h3>🎯 What's Next?</h3>
            <p>We've created <strong>${taskCount} essential maintenance tasks</strong> tailored specifically for your home. These tasks are scheduled at optimal times throughout the year to:</p>
            <ul>
              <li>Prevent costly repairs before they happen</li>
              <li>Maintain your home's value and efficiency</li>
              <li>Keep your family safe and comfortable</li>
            </ul>
          </div>
          
          <p>You'll receive friendly reminders via email 7 days before each task is due, along with step-by-step instructions and calendar events you can add to your schedule.</p>
          
          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="cta-button">📅 View Your Schedule</a>
          </div>
          
          <p><strong>Your first reminder will arrive soon!</strong> We've aligned your maintenance schedule with the seasons to ensure each task happens at the perfect time for your ${climateZone} climate.</p>
        </div>
        
        <div class="footer">
          <p>🔧 AgentHub - Smart Home Maintenance</p>
          <p>Questions? Reply to this email for support.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textBody = `
Welcome to AgentHub!

Hi${firstName ? ` ${firstName}` : ''}!

Congratulations! Your ${homeType} is now set up with a personalized maintenance schedule optimized for your ${climateZone} climate zone.

What's Next?
We've created ${taskCount} essential maintenance tasks tailored specifically for your home. These tasks are scheduled at optimal times throughout the year to:
- Prevent costly repairs before they happen
- Maintain your home's value and efficiency  
- Keep your family safe and comfortable

You'll receive friendly reminders via email 7 days before each task is due, along with step-by-step instructions and calendar events you can add to your schedule.

View your schedule: ${dashboardUrl}

Your first reminder will arrive soon! We've aligned your maintenance schedule with the seasons to ensure each task happens at the perfect time for your ${climateZone} climate.

Questions? Reply to this email for support.

AgentHub - Smart Home Maintenance
  `;

  await postmarkClient.sendEmail({
    From: "noreply@agenthub.com",
    To: email,
    Subject: subject,
    HtmlBody: htmlBody,
    TextBody: textBody,
  });
}

/**
 * Send task reminder email with ICS attachment
 */
export async function sendReminderEmail(data: ReminderEmailData): Promise<void> {
  const { email, firstName, taskTitle, dueDate, description, howToSteps, icsAttachment } = data;
  
  const dueDateFormatted = new Date(dueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric', 
    month: 'long',
    day: 'numeric'
  });
  
  const subject = `🔔 Reminder: ${taskTitle} - Due ${dueDateFormatted}`;
  
  const stepsHtml = howToSteps.map((step, index) => 
    `<li><strong>Step ${index + 1}:</strong> ${step}</li>`
  ).join('');
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; }
        .task-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px 0; }
        .due-date { background: #fff3e0; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; border-left: 4px solid #ff9a56; }
        .steps { background: #e8f5e8; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .steps ol { margin: 0; padding-left: 20px; }
        .steps li { margin: 10px 0; }
        .footer { background: #6c757d; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Maintenance Reminder</h1>
          <p>Time for your scheduled home care</p>
        </div>
        
        <div class="content">
          <h2>Hi${firstName ? ` ${firstName}` : ''}! 👋</h2>
          
          <div class="task-card">
            <h3>📋 ${taskTitle}</h3>
            <p>${description}</p>
            
            <div class="due-date">
              <h4>📅 Due Date</h4>
              <p><strong>${dueDateFormatted}</strong></p>
            </div>
          </div>
          
          <div class="steps">
            <h3>🛠️ How to Complete This Task</h3>
            <ol>
              ${stepsHtml}
            </ol>
          </div>
          
          <p><strong>💡 Pro Tip:</strong> Add this task to your calendar using the attached event file, or set a reminder on your phone!</p>
          
          <p>Need help? Reply to this email and we'll provide additional guidance for your specific situation.</p>
        </div>
        
        <div class="footer">
          <p>🔧 AgentHub - Smart Home Maintenance</p>
          <p>Keeping your home in perfect condition, one task at a time.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textBody = `
Maintenance Reminder

Hi${firstName ? ` ${firstName}` : ''}!

${taskTitle}
${description}

Due Date: ${dueDateFormatted}

How to Complete This Task:
${howToSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

Pro Tip: Add this task to your calendar using the attached event file, or set a reminder on your phone!

Need help? Reply to this email and we'll provide additional guidance for your specific situation.

AgentHub - Smart Home Maintenance
Keeping your home in perfect condition, one task at a time.
  `;

  const emailData: any = {
    From: "reminders@agenthub.com",
    To: email,
    Subject: subject,
    HtmlBody: htmlBody,
    TextBody: textBody,
  };
  
  // Add ICS attachment if provided
  if (icsAttachment) {
    emailData.Attachments = [{
      Name: `${taskTitle.replace(/[^a-zA-Z0-9]/g, '_')}.ics`,
      Content: icsAttachment.toString('base64'),
      ContentType: 'text/calendar',
    }];
  }

  await postmarkClient.sendEmail(emailData);
}

/**
 * Get how-to steps for common maintenance tasks
 */
export function getTaskHowToSteps(taskName: string): string[] {
  const howToGuides: Record<string, string[]> = {
    'HVAC Filter Change': [
      'Turn off your HVAC system at the thermostat',
      'Locate the air filter (usually in the return air duct or furnace)',
      'Note the filter size printed on the frame (e.g., 16x25x1)',
      'Remove the old filter and dispose of it properly',
      'Insert the new filter with the airflow arrow pointing toward the furnace',
      'Turn your HVAC system back on and mark your calendar for the next change'
    ],
    'Smoke Detector Test': [
      'Press and hold the test button on each smoke detector',
      'Listen for the loud alarm sound (cover your ears!)',
      'If no sound, replace the battery and test again',
      'Test carbon monoxide detectors the same way',
      'Replace any detectors that don\'t respond after battery replacement',
      'Clean detector covers with a vacuum brush attachment'
    ],
    'Gutter Cleaning': [
      'Use a sturdy ladder and have someone spot you',
      'Wear work gloves and safety glasses',
      'Remove debris by hand or with a small garden trowel',
      'Flush gutters with a garden hose to check drainage',
      'Clear any clogs in downspouts with a plumber\'s snake',
      'Check for loose brackets and tighten as needed'
    ],
    'Water Heater Maintenance': [
      'Turn off power to electric unit or set gas to pilot',
      'Attach a garden hose to the drain valve at the bottom',
      'Open the drain valve and let water flow until it runs clear',
      'Close the drain valve and refill the tank',
      'Check the temperature/pressure relief valve by lifting the lever briefly',
      'Set temperature to 120°F and restore power/gas'
    ],
    'Caulk Inspection': [
      'Check around windows, doors, and bathroom fixtures',
      'Look for cracks, gaps, or missing caulk',
      'Remove old, damaged caulk with a caulk removal tool',
      'Clean the area thoroughly with rubbing alcohol',
      'Apply new caulk in a smooth, continuous bead',
      'Smooth with your finger or a caulk tool within 5 minutes'
    ],
    'Deck/Patio Maintenance': [
      'Sweep away all debris and leaves',
      'Scrub with a deck cleaner and stiff brush',
      'Rinse thoroughly with a garden hose',
      'Allow to dry completely (24-48 hours)',
      'Apply wood stain or concrete sealer if needed',
      'Check for loose boards, railings, or damaged hardware'
    ]
  };
  
  return howToGuides[taskName] || [
    'Review the specific requirements for this maintenance task',
    'Gather necessary tools and materials',
    'Follow manufacturer guidelines or consult a professional if needed',
    'Complete the task safely and thoroughly',
    'Document completion and schedule the next occurrence'
  ];
}