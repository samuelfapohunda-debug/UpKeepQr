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

export interface LeadNotificationData {
  service: string;
  householdZip: string;
  homeType: string;
  customerEmail: string;
  notes: string;
  leadId: string;
}

export interface OrderConfirmationData {
  email: string;
  customerName?: string;
  orderId: string;
  amount: number;
  quantity: number;
  agentId: string;
  downloadUrl?: string;
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

/**
 * Send lead notification email to partners
 */
export async function sendLeadNotificationEmail(
  recipientEmail: string,
  subject: string,
  data: LeadNotificationData
): Promise<void> {
  const { service, householdZip, homeType, customerEmail, notes, leadId } = data;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; }
        .lead-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #666; }
        .footer { background: #6c757d; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔧 New Service Lead</h1>
          <p>Professional service request from AgentHub</p>
        </div>
        
        <div class="content">
          <div class="lead-card">
            <h3>Lead Details</h3>
            <div class="detail-row">
              <span class="detail-label">Service Type:</span>
              <span>${service.toUpperCase()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Location:</span>
              <span>${householdZip}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Home Type:</span>
              <span>${homeType}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Customer Email:</span>
              <span>${customerEmail}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Lead ID:</span>
              <span>${leadId}</span>
            </div>
            ${notes ? `
            <div style="margin-top: 15px;">
              <div class="detail-label">Additional Notes:</div>
              <div style="background: #f0f0f0; padding: 10px; border-radius: 4px; margin-top: 5px;">
                ${notes}
              </div>
            </div>
            ` : ''}
          </div>
          
          <p><strong>Next Steps:</strong> Please contact the customer within 24 hours to schedule a consultation.</p>
        </div>
        
        <div class="footer">
          <p>🏠 AgentHub Lead Management</p>
          <p>This lead was generated from our home maintenance platform.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textBody = `
New Service Lead - AgentHub

Service Type: ${service.toUpperCase()}
Location: ${householdZip}
Home Type: ${homeType}
Customer Email: ${customerEmail}
Lead ID: ${leadId}

${notes ? `Additional Notes: ${notes}` : ''}

Next Steps: Please contact the customer within 24 hours to schedule a consultation.

AgentHub Lead Management
This lead was generated from our home maintenance platform.
  `;

  await postmarkClient.sendEmail({
    From: "leads@agenthub.com",
    To: recipientEmail,
    Subject: subject,
    HtmlBody: htmlBody,
    TextBody: textBody,
  });
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(data: OrderConfirmationData): Promise<void> {
  const { email, customerName, orderId, amount, quantity, agentId, downloadUrl } = data;
  
  const subject = `Order Confirmation - Your UpKeepQR Magnet Pack is Ready!`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1E2A38 0%, #2A3F4F 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; }
        .order-summary { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #666; }
        .total-row { font-size: 18px; font-weight: bold; color: #A6E22E; border-top: 2px solid #A6E22E; margin-top: 10px; padding-top: 10px; }
        .cta-button { display: inline-block; background: #A6E22E; color: #1E2A38; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { background: #1E2A38; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="display: inline-block; background: #A6E22E; padding: 8px 16px; border-radius: 4px; margin-bottom: 15px;">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
              <rect width="32" height="32" rx="6" fill="#A6E22E"/>
              <path d="M16 6L8 12H10V20H14V16H18V20H22V12H24L16 6Z" fill="white"/>
              <path d="M12 18L14 20L20 14" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span style="color: #1E2A38; font-weight: bold; margin-left: 8px; font-size: 18px; vertical-align: middle;">UpKeepQR</span>
          </div>
          <h1>✅ Order Confirmed!</h1>
          <p>Your UpKeepQR magnet pack is ready for download</p>
        </div>
        
        <div class="content">
          <h2>Thank you${customerName ? ` ${customerName}` : ''} for your order! 🎉</h2>
          
          <p>Your QR code magnet pack has been successfully created and is ready for download. Each magnet includes a unique QR code that will guide your customers through the home maintenance setup process.</p>
          
          <div class="order-summary">
            <h3>Order Summary</h3>
            <div class="detail-row">
              <span class="detail-label">Order ID:</span>
              <span>${orderId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Agent ID:</span>
              <span>${agentId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Quantity:</span>
              <span>${quantity} magnets</span>
            </div>
            <div class="detail-row total-row">
              <span>Total Paid:</span>
              <span>$${(amount / 100).toFixed(2)}</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <h3>🔗 Next Steps</h3>
            <p>Access your agent dashboard to download your magnet pack CSV file with all QR codes and setup links:</p>
            <a href="${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/agent" class="cta-button">📱 Access Agent Dashboard</a>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4>📋 What's Included:</h4>
            <ul>
              <li><strong>CSV File:</strong> All magnet tokens and setup URLs for easy reference</li>
              <li><strong>QR Codes:</strong> Individual QR codes for each magnet (generated on-demand)</li>
              <li><strong>PDF Proof Sheet:</strong> Professional layout for printing verification</li>
              <li><strong>Setup Links:</strong> Direct URLs for customers who prefer manual entry</li>
            </ul>
          </div>
          
          <p><strong>Important:</strong> Keep your CSV file secure as it contains unique tokens for your customers. You can regenerate QR codes anytime from your agent dashboard.</p>
        </div>
        
        <div class="footer">
          <p>🏠 UpKeepQR - Smart Home Maintenance QR Solutions</p>
          <p>Questions? Reply to this email or contact support.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textBody = `
Order Confirmed!

Thank you${customerName ? ` ${customerName}` : ''} for your order!

Your UpKeepQR magnet pack has been successfully created and is ready for download. Each magnet includes a unique QR code that will guide your customers through the home maintenance setup process.

Order Summary:
- Order ID: ${orderId}
- Agent ID: ${agentId}
- Quantity: ${quantity} magnets
- Total Paid: $${(amount / 100).toFixed(2)}

Next Steps:
Access your agent dashboard to download your magnet pack CSV file with all QR codes and setup links:
${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/agent

What's Included:
- CSV File: All magnet tokens and setup URLs for easy reference
- QR Codes: Individual QR codes for each magnet (generated on-demand)
- PDF Proof Sheet: Professional layout for printing verification
- Setup Links: Direct URLs for customers who prefer manual entry

Important: Keep your CSV file secure as it contains unique tokens for your customers. You can regenerate QR codes anytime from your agent dashboard.

Questions? Reply to this email or contact support.

UpKeepQR - Smart Home Maintenance QR Solutions
  `;

  await postmarkClient.sendEmail({
    From: "support@upkeepqr.com",
    To: email,
    Subject: subject,
    HtmlBody: htmlBody,
    TextBody: textBody,
  });
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  topic: string;
  zip: string;
  message: string;
}

/**
 * Send contact form emails (customer confirmation + support notification)
 */
export async function sendContactFormEmails(data: ContactFormData): Promise<void> {
  const { name, email, phone, topic, zip, message } = data;

  try {
    // Send auto-reply to customer
    const autoReplyHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1E2A38; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; }
          .highlight { background: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #A6E22E; }
          .footer { background: #6c757d; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 Thank you for contacting UpkeepQR!</h1>
            <p>We've received your message</p>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thanks for reaching out about <strong>${topic}</strong>! We've received your message and will get back to you within 24 hours.</p>
            
            <div class="highlight">
              <h3>Your message:</h3>
              <p>${message}</p>
            </div>
            
            <p>We'll send you a copy of this confirmation for your records.</p>
            <p>Best regards,<br>The UpkeepQR Team<br>support@upkeepqr.com</p>
          </div>
          <div class="footer">
            <p>This is an automated confirmation. You can reply directly to this email if you have additional questions.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await postmarkClient.sendEmail({
      From: "support@upkeepqr.com",
      To: email,
      Subject: `Re: ${topic} - Thanks for contacting UpkeepQR!`,
      HtmlBody: autoReplyHtml,
      TextBody: `Hi ${name},\n\nThanks for reaching out about ${topic}! We've received your message and will get back to you within 24 hours.\n\nYour message: ${message}\n\nWe'll send you a copy of this confirmation for your records.\n\nBest regards,\nThe UpkeepQR Team\nsupport@upkeepqr.com`
    });

    // Send notification to support team
    const supportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #A6E22E; color: #1E2A38; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; }
          .field { margin: 10px 0; }
          .label { font-weight: bold; color: #1E2A38; }
          .message-box { background: #ffffff; padding: 15px; border-radius: 6px; margin: 10px 0; border-left: 4px solid #A6E22E; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🆕 New Contact Form Submission</h2>
          </div>
          <div class="content">
            <div class="field"><span class="label">Name:</span> ${name}</div>
            <div class="field"><span class="label">Email:</span> ${email}</div>
            <div class="field"><span class="label">Phone:</span> ${phone || 'Not provided'}</div>
            <div class="field"><span class="label">Subject:</span> ${topic}</div>
            <div class="field"><span class="label">ZIP Code:</span> ${zip || 'Not provided'}</div>
            
            <div class="field">
              <span class="label">Message:</span>
              <div class="message-box">${message}</div>
            </div>
            
            <p><em>Consent given: Customer agreed to be contacted about their enquiry.</em></p>
          </div>
        </div>
      </body>
      </html>
    `;

    await postmarkClient.sendEmail({
      From: "noreply@upkeepqr.com",
      To: "support@upkeepqr.com",
      Subject: `New Contact: ${topic}`,
      HtmlBody: supportHtml,
      TextBody: `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nSubject: ${topic}\nZIP: ${zip || 'Not provided'}\n\nMessage:\n${message}\n\nConsent given: Customer agreed to be contacted about their enquiry.`
    });

    console.log(`✅ Contact form emails sent: confirmation to ${email}, notification to support`);
  } catch (error) {
    console.error("Error sending contact form emails:", error);
    throw error;
  }
}