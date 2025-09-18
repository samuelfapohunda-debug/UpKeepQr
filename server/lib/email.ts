// SendGrid email service for Request a Pro notifications
// Based on blueprint: javascript_sendgrid
import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set - email notifications disabled");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('Email would be sent:', params.subject, 'to', params.to);
      return true; // Return true in development when API key not set
    }

    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

// Email templates for Request a Pro feature
const FROM_EMAIL: string = process.env.FROM_EMAIL || 'noreply@upkeepqr.com';
const ADMIN_EMAIL: string = process.env.ADMIN_EMAIL || 'admin@upkeepqr.com';

export async function sendUserConfirmationEmail(
  userEmail: string,
  userName: string,
  requestId: string,
  trackingCode: string,
  trade: string
): Promise<boolean> {
  const subject = `Service Request Confirmed - ${trade} Service`;
  
  const html = `
    <h2>Your Service Request Has Been Submitted</h2>
    <p>Hi ${userName},</p>
    <p>Thank you for submitting your ${trade} service request. We've received your request and will match you with a qualified professional in your area.</p>
    
    <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3>Request Details</h3>
      <p><strong>Request ID:</strong> ${requestId}</p>
      <p><strong>Tracking Code:</strong> ${trackingCode}</p>
      <p><strong>Service Type:</strong> ${trade}</p>
    </div>
    
    <p>You can track the status of your request using tracking code: <strong>${trackingCode}</strong></p>
    
    <p>We'll notify you as soon as we match you with a service provider!</p>
    
    <p>Best regards,<br>The UpKeepQR Team</p>
  `;

  const text = `
Your Service Request Has Been Submitted

Hi ${userName},

Thank you for submitting your ${trade} service request. We've received your request and will match you with a qualified professional in your area.

Request ID: ${requestId}
Tracking Code: ${trackingCode}
Service Type: ${trade}

You can track the status of your request using tracking code: ${trackingCode}

We'll notify you as soon as we match you with a service provider!

Best regards,
The UpKeepQR Team
  `;

  return sendEmail({
    to: userEmail,
    from: FROM_EMAIL,
    subject,
    html,
    text
  });
}

export async function sendAdminAlertEmail(
  requestId: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  trade: string,
  urgency: string,
  description: string,
  address: string
): Promise<boolean> {
  const subject = `New Service Request: ${trade} (${urgency})`;
  
  const html = `
    <h2>New Service Request Received</h2>
    <p>A new ${trade} service request has been submitted and needs attention.</p>
    
    <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3>Request Details</h3>
      <p><strong>Request ID:</strong> ${requestId}</p>
      <p><strong>Service Type:</strong> ${trade}</p>
      <p><strong>Urgency:</strong> ${urgency}</p>
      <p><strong>Description:</strong> ${description}</p>
      <p><strong>Address:</strong> ${address}</p>
    </div>
    
    <div style="background: #e8f4fd; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3>Customer Information</h3>
      <p><strong>Name:</strong> ${customerName}</p>
      <p><strong>Email:</strong> ${customerEmail}</p>
      <p><strong>Phone:</strong> ${customerPhone}</p>
    </div>
    
    <p>Please review and assign a service provider as soon as possible.</p>
    
    <p>Admin Dashboard: <a href="${process.env.BASE_URL || ''}/admin">View All Requests</a></p>
  `;

  const text = `
New Service Request Received

A new ${trade} service request has been submitted and needs attention.

Request Details:
- Request ID: ${requestId}
- Service Type: ${trade}
- Urgency: ${urgency}
- Description: ${description}
- Address: ${address}

Customer Information:
- Name: ${customerName}
- Email: ${customerEmail}
- Phone: ${customerPhone}

Please review and assign a service provider as soon as possible.
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    subject,
    html,
    text
  });
}

export async function sendStatusUpdateEmail(
  userEmail: string,
  userName: string,
  requestId: string,
  trackingCode: string,
  trade: string,
  newStatus: string,
  providerName?: string
): Promise<boolean> {
  const subject = `Service Request Update - ${trade} Service`;
  
  let statusMessage = '';
  let nextSteps = '';
  
  switch (newStatus) {
    case 'assigned':
      statusMessage = `Great news! We've assigned a qualified ${trade} professional to your request.`;
      nextSteps = providerName 
        ? `Your assigned provider is ${providerName}. They will contact you soon to schedule the service.`
        : 'Your assigned provider will contact you soon to schedule the service.';
      break;
    case 'in_progress':
      statusMessage = `Your ${trade} service is now in progress.`;
      nextSteps = 'Your service provider is working on your request and will update you on completion.';
      break;
    case 'completed':
      statusMessage = `Your ${trade} service has been completed!`;
      nextSteps = 'We hope you\'re satisfied with the service. Please let us know if you need anything else.';
      break;
    case 'cancelled':
      statusMessage = `Your ${trade} service request has been cancelled.`;
      nextSteps = 'If you still need this service, please feel free to submit a new request.';
      break;
    default:
      statusMessage = `Your ${trade} service request status has been updated to: ${newStatus}`;
      nextSteps = 'We\'ll keep you updated on any further changes.';
  }
  
  const html = `
    <h2>Service Request Status Update</h2>
    <p>Hi ${userName},</p>
    <p>${statusMessage}</p>
    
    <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3>Request Details</h3>
      <p><strong>Request ID:</strong> ${requestId}</p>
      <p><strong>Tracking Code:</strong> ${trackingCode}</p>
      <p><strong>Service Type:</strong> ${trade}</p>
      <p><strong>New Status:</strong> ${newStatus}</p>
      ${providerName ? `<p><strong>Service Provider:</strong> ${providerName}</p>` : ''}
    </div>
    
    <p>${nextSteps}</p>
    
    <p>You can always track your request status using tracking code: <strong>${trackingCode}</strong></p>
    
    <p>Best regards,<br>The UpKeepQR Team</p>
  `;

  const text = `
Service Request Status Update

Hi ${userName},

${statusMessage}

Request Details:
- Request ID: ${requestId}
- Tracking Code: ${trackingCode}
- Service Type: ${trade}
- New Status: ${newStatus}
${providerName ? `- Service Provider: ${providerName}` : ''}

${nextSteps}

You can always track your request status using tracking code: ${trackingCode}

Best regards,
The UpKeepQR Team
  `;

  return sendEmail({
    to: userEmail,
    from: FROM_EMAIL,
    subject,
    html,
    text
  });
}