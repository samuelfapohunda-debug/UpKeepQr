import { MailService } from '@sendgrid/mail';

const mailService = new MailService();

// Initialize SendGrid with better error handling
if (!process.env.SENDGRID_API_KEY) {
  console.warn("⚠️ SENDGRID_API_KEY not set - email notifications disabled");
} else {
  console.log("✅ SENDGRID_API_KEY loaded, initializing...");
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
      console.log('⚠️ SENDGRID_API_KEY not set. Email would be sent:', params.subject, 'to', params.to);
      return true;
    }

    console.log('📧 Attempting to send email:', {
      to: params.to,
      from: params.from,
      subject: params.subject
    });

    const result = await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    console.log('✅ Email sent successfully:', {
      to: params.to,
      statusCode: result[0].statusCode
    });

    return true;
  } catch (error: any) {
    console.error('❌ SendGrid email error:', {
      message: error.message,
      code: error.code,
      response: error.response?.body || 'No response body',
      to: params.to,
      from: params.from
    });
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
    <p>Thank you for submitting your ${trade} service request.</p>
  `;

  const text = `Your Service Request Has Been Submitted

Hi ${userName},

Thank you for submitting your ${trade} service request.`;

  return sendEmail({
    to: userEmail,
    from: FROM_EMAIL,
    subject,
    html,
    text
  });
}
