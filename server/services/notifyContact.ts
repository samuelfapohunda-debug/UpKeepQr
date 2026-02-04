import { sendEmail } from '../sendgrid';

// Helper function to generate ticket ID like CU-48271
export function makeTicketId(): string {
  const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CU-${randomId}`;
}

// Helper function to get first name from full name
export function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] || 'there';
}

// Environment variables
const FROM_EMAIL = process.env.FROM_EMAIL || 'Support@UpKeepQr.Com';
const FROM_NAME = process.env.FROM_NAME || 'UpKeepQR Support';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'ops@upkeepqr.com,admin@upkeepqr.com').split(',').map(email => email.trim());
const SENDGRID_TEMPLATE_CONTACT_ACK = process.env.SENDGRID_TEMPLATE_CONTACT_ACK;
const _SENDGRID_SANDBOX_MODE = process.env.SENDGRID_SANDBOX_MODE === 'true';
const _SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || FROM_EMAIL;

interface ContactAckEmailParams {
  name: string;
  email: string;
  subject: string;
  message: string;
  ticketId: string;
}

interface ContactOpsEmailParams {
  name: string;
  email: string;
  subject: string;
  message: string;
  ticketId: string;
  createdAt: Date;
}

// Customer acknowledgment email with exact copy from spec
export async function sendContactAckEmail(params: ContactAckEmailParams): Promise<boolean> {
  const { name, email, subject, _message, ticketId } = params;
  const firstName = getFirstName(name);

  const emailSubject = `Thanks for reaching out to UpKeepQR (Ticket ${ticketId})`;
  
  // Plain text version
  const textContent = `Hi ${firstName},

Thanks for contacting UpKeepQR! We received your message:

Subject: ${subject}
Ticket: ${ticketId}

Our team typically replies within one business day (often much faster).
If you have more details or photos to add, simply reply to this email
and they'll attach to your ticket.

Helpful links:
• Track product updates: https://upkeepqr.com/updates
• FAQs: https://upkeepqr.com/help

Warmly,
UpKeepQR Support
support@upkeepqr.com`;

  // HTML version with header/footer for consistent branding
  const htmlContent = `<!doctype html>
<html>
  <body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;margin:0;padding:0;background:#f4f4f4;">
    <div style="max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#10b981;padding:30px;text-align:center;border-radius:8px 8px 0 0;">
        <div style="font-size:28px;font-weight:700;color:white;">UpKeepQR</div>
      </div>
      <div style="background:#ffffff;padding:30px;border:1px solid #e5e7eb;border-top:none;">
        <h2 style="margin:0 0 8px;color:#333;">Thanks, ${firstName} — we've got your message.</h2>
        <p style="margin:0 0 16px;color:#444;">Ticket <strong>${ticketId}</strong> - Subject: <strong>${subject}</strong></p>
        <p style="margin:0 0 12px;color:#333;">Our team typically replies within <strong>one business day</strong> (usually much faster). If you have more details or photos, just reply to this email—your reply will attach to the same ticket.</p>
        <p style="margin:0 0 16px;color:#333;">In the meantime, these may help:</p>
        <ul style="margin:0 0 16px;color:#333;">
          <li><a href="https://upkeepqr.com/updates" style="color:#10b981;">Product updates</a></li>
          <li><a href="https://upkeepqr.com/help" style="color:#10b981;">FAQs & guides</a></li>
        </ul>
        <p style="margin:24px 0 0;color:#333;">Warmly,<br/>The UpKeepQR Support Team<br/><a href="mailto:support@upkeepqr.com" style="color:#10b981;">support@upkeepqr.com</a></p>
      </div>
      <div style="background:#f9fafb;padding:20px 30px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;border-radius:0 0 8px 8px;">
        <p style="margin:0 0 5px 0;">&copy; ${new Date().getFullYear()} UpKeepQR. All rights reserved.</p>
        <p style="margin:0;">You're receiving this because you contacted us through our website.</p>
      </div>
    </div>
  </body>
</html>`;

  try {
    // Use dynamic template if configured, otherwise use HTML fallback
    if (SENDGRID_TEMPLATE_CONTACT_ACK) {
      // Use SendGrid dynamic template (implementation would go here)
      // For now, falling back to HTML version
    }

    const success = await sendEmail({
      to: email,
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      subject: emailSubject,
      text: textContent,
      html: htmlContent,
    });

    if (success) {
      console.log(`✅ Customer acknowledgment email sent to ${email} (Ticket: ${ticketId})`);
    } else {
      console.error(`❌ Failed to send customer acknowledgment email to ${email} (Ticket: ${ticketId})`);
    }

    return success;
  } catch (error) {
    console.error(`❌ Error sending customer acknowledgment email to ${email}:`, error);
    return false;
  }
}

// Internal ops notification email
export async function sendContactOpsEmail(params: ContactOpsEmailParams): Promise<boolean> {
  const { name, email, subject, message, ticketId, createdAt } = params;

  const emailSubject = `[ContactUs] ${ticketId} — ${subject}`;
  
  // Plain text content for ops
  const textContent = `New Contact Us message

Ticket: ${ticketId}
From: ${name} <${email}>
Subject: ${subject}
Received: ${createdAt.toISOString()}

Message:
${message}

Reply-to this email to respond to the customer.`;

  // HTML version for ops
  const htmlContent = `<!doctype html>
<html>
  <body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;margin:0;padding:24px;">
    <h2 style="margin:0 0 16px;color:#333;">New Contact Us Message</h2>
    <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin-bottom:16px;">
      <p style="margin:0;"><strong>Ticket:</strong> ${ticketId}</p>
      <p style="margin:8px 0 0;"><strong>From:</strong> ${name} &lt;${email}&gt;</p>
      <p style="margin:8px 0 0;"><strong>Subject:</strong> ${subject}</p>
      <p style="margin:8px 0 0;"><strong>Received:</strong> ${createdAt.toLocaleString()}</p>
    </div>
    <h3 style="margin:0 0 8px;">Message:</h3>
    <div style="background:#fff;border:1px solid #ddd;padding:16px;border-radius:8px;white-space:pre-wrap;">${message}</div>
    <p style="margin:24px 0 0;color:#666;font-size:14px;">Reply to this email to respond to the customer.</p>
  </body>
</html>`;

  try {
    // Send to all admin emails
    const promises = ADMIN_EMAILS.map(adminEmail => 
      sendEmail({
        to: adminEmail.trim(),
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        replyTo: email, // Set reply-to to customer's email
        subject: emailSubject,
        text: textContent,
        html: htmlContent,
      } as Record<string, unknown>)
    );

    const results = await Promise.all(promises);
    const allSuccessful = results.every(result => result === true);

    if (allSuccessful) {
      console.log(`✅ Ops notification emails sent to ${ADMIN_EMAILS.join(', ')} (Ticket: ${ticketId})`);
    } else {
      console.error(`❌ Some ops notification emails failed (Ticket: ${ticketId})`);
    }

    return allSuccessful;
  } catch (error) {
    console.error(`❌ Error sending ops notification emails (Ticket: ${ticketId}):`, error);
    return false;
  }
}

// Retry logic with exponential backoff (max 3 attempts)
export async function sendEmailWithRetry<T extends unknown[]>(
  emailFunction: (...args: T) => Promise<boolean>,
  ...args: T
): Promise<boolean> {
  const maxAttempts = 3;
  let attempt = 1;

  while (attempt <= maxAttempts) {
    try {
      const result = await emailFunction(...args);
      if (result) return true;
      
      if (attempt === maxAttempts) {
        console.error(`Email sending failed after ${maxAttempts} attempts`);
        return false;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`Email sending attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      attempt++;
    } catch (error) {
      if (attempt === maxAttempts) {
        console.error(`Email sending failed after ${maxAttempts} attempts:`, error);
        return false;
      }
      
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`Email sending attempt ${attempt} failed with error, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      attempt++;
    }
  }

  return false;
}