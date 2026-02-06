import { sendEmail } from './email.js';

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@maintcue.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@maintcue.com';
const APP_URL = process.env.FRONTEND_URL || 'https://maintcue.com';

export const sendWelcomeEmail = async (params: { email: string; name: string; [key: string]: unknown }) => {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <span style="font-size: 32px; font-weight: 700; color: #fff;">Maint</span><span style="font-size: 32px; font-weight: 700; color: #1E3A5F;">Cue</span>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Welcome to MaintCue</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p>Hi ${params.name},</p>
    <p>Welcome to MaintCue! Your account has been set up and you're ready to start managing your home maintenance.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${APP_URL}/my-home" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Your Dashboard</a>
    </div>
  </div>
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; color: #6b7280; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
  </div>
</body>
</html>`;

  const result = await sendEmail({
    to: params.email,
    from: FROM_EMAIL,
    subject: 'Welcome to MaintCue',
    html,
    text: `Hi ${params.name}, welcome to MaintCue! Visit ${APP_URL}/my-home to get started.`
  });
  return { success: result };
};

export const sendOrderConfirmationEmail = async (params: { email: string; orderId: string; [key: string]: unknown }) => {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <span style="font-size: 32px; font-weight: 700; color: #fff;">Maint</span><span style="font-size: 32px; font-weight: 700; color: #1E3A5F;">Cue</span>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Order Confirmation</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p>Your order <strong>${params.orderId}</strong> has been confirmed.</p>
    <p>We'll process your order and send you tracking information soon.</p>
  </div>
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; color: #6b7280; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
  </div>
</body>
</html>`;

  const result = await sendEmail({
    to: params.email,
    from: FROM_EMAIL,
    subject: `MaintCue Order Confirmed - ${params.orderId}`,
    html,
    text: `Your order ${params.orderId} has been confirmed. We'll process it and send tracking info soon.`
  });
  return { success: result };
};

export const sendContactFormEmails = async (params: { name: string; email: string; message: string; [key: string]: unknown }) => {
  const adminHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <span style="font-size: 32px; font-weight: 700; color: #fff;">Maint</span><span style="font-size: 32px; font-weight: 700; color: #1E3A5F;">Cue</span>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">New Contact Form Submission</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #10b981; border-radius: 0 4px 4px 0; margin-bottom: 16px;">
      <strong>From:</strong> ${params.name}<br>
      <strong>Email:</strong> ${params.email}
    </div>
    <p><strong>Message:</strong></p>
    <p>${params.message}</p>
  </div>
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; color: #6b7280; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
  </div>
</body>
</html>`;

  const result = await sendEmail({
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    subject: `New Contact Form: ${params.name}`,
    html: adminHtml,
    text: `New contact from ${params.name} (${params.email}): ${params.message}`
  });
  return { success: result };
};

export const sendLeadNotificationEmail = async (params: { name: string; email: string; phone: string; [key: string]: unknown }) => {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <span style="font-size: 32px; font-weight: 700; color: #fff;">Maint</span><span style="font-size: 32px; font-weight: 700; color: #1E3A5F;">Cue</span>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">New Lead</p>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #10b981; border-radius: 0 4px 4px 0;">
      <strong>Name:</strong> ${params.name}<br>
      <strong>Email:</strong> ${params.email}<br>
      <strong>Phone:</strong> ${params.phone}
    </div>
  </div>
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; color: #6b7280; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
  </div>
</body>
</html>`;

  const result = await sendEmail({
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    subject: `New Lead: ${params.name}`,
    html,
    text: `New lead: ${params.name}, ${params.email}, ${params.phone}`
  });
  return { success: result };
};

export const sendReminderEmail = async (params: {
  email: string;
  firstName: string;
  taskTitle: string;
  dueDate: string;
  description: string;
  howToSteps: string[];
  icsAttachment?: string;
}) => {
  const formattedDate = new Date(params.dueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const stepsHtml = params.howToSteps.length > 0
    ? `<h3 style="margin: 24px 0 12px 0; color: #1f2937; font-size: 16px;">How To Complete This Task:</h3>
       <ol style="margin: 0; padding-left: 20px; color: #4b5563;">
         ${params.howToSteps.map(step => `<li style="margin-bottom: 8px;">${step}</li>`).join('')}
       </ol>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <div style="margin-bottom: 8px;">
      <span style="font-size: 32px; font-weight: 700; color: #fff;">Maint</span><span style="font-size: 32px; font-weight: 700; color: #1E3A5F;">Cue</span>
    </div>
    <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Maintenance Reminder</p>
  </div>
  
  <div style="background: #fff; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none;">
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #92400e; font-weight: 600;">
        [i] Upcoming: ${params.taskTitle} is due ${formattedDate}
      </p>
    </div>

    <p>Hi ${params.firstName},</p>
    <p>This is a friendly reminder that a maintenance task is coming up for your home.</p>
    
    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px;">Task Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Task:</td>
          <td style="padding: 8px 0; font-weight: 500;">${params.taskTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Due Date:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #f59e0b;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Description:</td>
          <td style="padding: 8px 0;">${params.description}</td>
        </tr>
      </table>
    </div>

    ${stepsHtml}

    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/my-home" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Your Dashboard</a>
    </div>

    <p style="color: #6b7280; font-size: 14px;">
      Need help? <a href="${APP_URL}/request-pro" style="color: #10b981;">Request a Pro</a> to handle this for you.
    </p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin: 0 0 8px 0;"><span style="font-size: 18px; font-weight: 700;"><span style="color: #10B981;">Maint</span><span style="color: #1E3A5F;">Cue</span></span></p>
    <p style="margin: 0; color: #6b7280; font-size: 12px;">&copy; ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
    <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
      <a href="${APP_URL}" style="color: #10b981; text-decoration: none;">maintcue.com</a> |
      <a href="mailto:support@maintcue.com" style="color: #10b981; text-decoration: none;">support@maintcue.com</a>
    </p>
  </div>
</body>
</html>`;

  const text = `Maintenance Reminder

Hi ${params.firstName},

Your task "${params.taskTitle}" is due on ${formattedDate}.

${params.description}

${params.howToSteps.length > 0 ? 'Steps:\n' + params.howToSteps.map((s, i) => `${i + 1}. ${s}`).join('\n') : ''}

View your dashboard: ${APP_URL}/my-home

- The MaintCue Team`;

  const attachments = params.icsAttachment ? [{
    content: Buffer.from(params.icsAttachment).toString('base64'),
    filename: 'maintenance-reminder.ics',
    type: 'text/calendar',
    disposition: 'attachment' as const,
    content_id: 'ics-calendar'
  }] : undefined;

  const result = await sendEmail({
    to: params.email,
    from: FROM_EMAIL,
    subject: `Maintenance Reminder: ${params.taskTitle} - Due ${formattedDate}`,
    html,
    text,
    attachments
  });

  console.log(`[REMINDER EMAIL] ${result ? 'Sent' : 'Failed'} to ${params.email} for task "${params.taskTitle}"`);
  return { success: result };
};

export const getTaskHowToSteps = (taskName: string): string[] => {
  const taskSteps: Record<string, string[]> = {
    'hvac_filter': [
      'Turn off your HVAC system',
      'Locate the air filter (usually near the return air duct or blower)',
      'Remove the old filter and note the size',
      'Insert the new filter with airflow arrow pointing toward the duct',
      'Turn the system back on'
    ],
    'smoke_detector': [
      'Press the test button on each detector',
      'Replace batteries if the chirping sound is weak',
      'Clean the detector with a soft brush or vacuum',
      'Replace any detectors older than 10 years'
    ],
    'water_heater': [
      'Turn off power/gas to the water heater',
      'Attach a hose to the drain valve',
      'Open the valve and drain several gallons',
      'Close the valve and remove the hose',
      'Turn power/gas back on'
    ],
    'gutter_cleaning': [
      'Set up a stable ladder on level ground',
      'Remove debris by hand or with a scoop',
      'Flush gutters with a garden hose',
      'Check and clear downspouts',
      'Inspect for damage or loose fasteners'
    ]
  };

  const taskKey = taskName.toLowerCase().replace(/\s+/g, '_');
  if (taskSteps[taskKey]) {
    return taskSteps[taskKey];
  }

  return [
    'Review the task requirements and gather necessary tools',
    'Follow manufacturer guidelines or professional recommendations',
    'Complete the task safely and thoroughly',
    'Document completion and note any issues discovered',
    'Schedule the next maintenance reminder'
  ];
};
