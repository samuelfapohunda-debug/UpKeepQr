import { MailService, MailDataRequired } from '@sendgrid/mail';
import type { AttachmentData } from '@sendgrid/helpers/classes/attachment';

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
  attachments?: AttachmentData[];  // For inline CID images (Gmail/Outlook compatibility)
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

    const emailData: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    };
    
    // Add attachments if provided (for CID inline images)
    if (params.attachments && params.attachments.length > 0) {
      emailData.attachments = params.attachments;
    }
    
    const result = await mailService.send(emailData);

    console.log('✅ Email sent successfully:', {
      to: params.to,
      statusCode: result[0].statusCode
    });

    return true;
  } catch (error: any) {
    console.error('❌ SendGrid email error:', {
      message: error.message,
      code: error.code,
      statusCode: error.response?.statusCode,
      errors: error.response?.body?.errors || [],
      responseBody: JSON.stringify(error.response?.body || {}),
      to: params.to,
      from: params.from
    });
    return false;
  }
}

// Email templates for Request a Pro feature
const FROM_EMAIL: string = process.env.FROM_EMAIL || 'noreply@upkeepqr.com';
const ADMIN_EMAIL: string = process.env.ADMIN_EMAIL || 'admin@upkeepqr.com';

// Log email configuration at startup
console.log('📧 Email configuration loaded:', {
  FROM_EMAIL,
  ADMIN_EMAIL,
  sendgridConfigured: !!process.env.SENDGRID_API_KEY
});

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

export async function sendAdminNotificationEmail(
  userEmail: string,
  userName: string,
  requestId: string,
  trade: string
): Promise<boolean> {
  const subject = `New Service Request - ${trade}`;
  
  const html = `
    <h2>New Service Request</h2>
    <p>Customer: ${userName}</p>
    <p>Email: ${userEmail}</p>
    <p>Request ID: ${requestId}</p>
    <p>Service: ${trade}</p>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    subject,
    html
  });
}

/**
 * Send payment confirmation email to customer
 */
export async function sendPaymentConfirmationEmail(
  customerEmail: string,
  customerName: string,
  orderId: string,
  amountPaid: string,
  quantity: number
): Promise<boolean> {
  const subject = `Payment Confirmed - Order ${orderId}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #A6E22E; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f5f5f5; padding: 30px; }
        .footer { background: #272822; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; }
        .detail { margin: 15px 0; padding: 15px; background: white; border-left: 4px solid #A6E22E; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Payment Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>Thank you for your UpKeepQR purchase! Your payment has been successfully processed.</p>
          
          <div class="detail">
            <strong>Order ID:</strong> ${orderId}<br>
            <strong>Amount Paid:</strong> $${amountPaid}<br>
            <strong>Quantity:</strong> ${quantity} QR code${quantity > 1 ? 's' : ''}
          </div>
          
          <p>You'll receive a separate email with your QR codes and activation instructions shortly.</p>
          
          <p>If you have any questions, please contact us at support@upkeepqr.com</p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} UpKeepQR. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: customerEmail,
    from: FROM_EMAIL,
    subject,
    html
  });
}

/**
 * Send welcome email with QR codes to customer
 * Uses CID attachments for email client compatibility (Gmail, Outlook)
 */
export async function sendWelcomeEmailWithQR(params: {
  email: string;
  customerName: string;
  orderId: string;
  items: Array<{
    activationCode: string;
    qrCodeImage: string;  // Base64 data URL
    setupUrl: string;
  }>;
  quantity: number;
  sku: string;
}): Promise<boolean> {
  const { email, customerName, orderId, items, quantity, sku } = params;
  
  const baseUrl = process.env.PUBLIC_BASE_URL || 'https://upkeepqr.com';
  const downloadUrl = `${baseUrl}/api/orders/${orderId}/qr-codes`;
  
  const subject = `Welcome to UpKeepQR! Your QR Magnet${quantity > 1 ? 's Are' : ' Is'} Ready`;
  
  // Prepare CID attachments for inline QR code images
  // This ensures compatibility with Gmail/Outlook which block data URIs
  // For large orders (100-pack), only attach preview images to keep email size manageable
  const itemsToAttach = quantity > 10 ? items.slice(0, 2) : items;
  
  const attachments = itemsToAttach.map((item, index) => {
    // Validate and extract base64 data from data URL
    if (!item.qrCodeImage || !item.qrCodeImage.includes('base64,')) {
      console.warn(`⚠️ Invalid QR code image format for item ${index}, skipping attachment`);
      return null;
    }
    
    try {
      // Extract base64 data from data URL (remove "data:image/png;base64," prefix)
      const base64Data = item.qrCodeImage.split(',')[1];
      return {
        content: base64Data,
        filename: `qr-code-${index + 1}.png`,
        type: 'image/png',
        disposition: 'inline',
        content_id: `qr_code_${index}`  // CID for referencing in HTML
      };
    } catch (error) {
      console.error(`❌ Error processing QR code image for item ${index}:`, error);
      return null;
    }
  }).filter(Boolean) as AttachmentData[];  // Remove null entries
  
  // Special handling for large orders (100-pack)
  let qrRows;
  if (quantity > 10) {
    // Show only first 2 QR codes as preview for large orders
    const previewItems = items.slice(0, 2);
    
    qrRows = previewItems.map((item, index) => `
      <tr>
        <td style="padding: 20px; text-align: center; border-bottom: 1px solid #ddd;">
          <p style="font-size: 18px; font-weight: bold; color: #333333; margin-bottom: 15px;">
            QR Code #${index + 1}
          </p>
          <img 
            src="cid:qr_code_${index}" 
            alt="QR Code ${index + 1}" 
            style="
              width: 250px; 
              height: 250px; 
              margin: 15px auto; 
              display: block; 
              border: 3px solid #A6E22E; 
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            " 
          />
          <p style="font-size: 14px; color: #666666; margin: 15px 0 5px 0;">
            Activation Code:
          </p>
          <p style="
            font-family: 'Courier New', Courier, monospace; 
            font-size: 16px; 
            font-weight: bold; 
            color: #333333; 
            background: #f5f5f5; 
            padding: 10px 20px; 
            border-radius: 4px; 
            display: inline-block;
            margin: 5px 0 20px 0;
            letter-spacing: 2px;
          ">
            ${item.activationCode}
          </p>
          <br/>
          <a 
            href="${item.setupUrl}" 
            style="
              display: inline-block; 
              padding: 12px 24px; 
              background: #A6E22E; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px; 
              margin-top: 15px; 
              font-weight: bold; 
              font-size: 14px;
              box-shadow: 0 2px 4px rgba(166, 226, 46, 0.3);
            "
          >
            📱 Activate This Magnet
          </a>
        </td>
      </tr>
    `).join('');
    
    // Add note about remaining QR codes
    qrRows += `
      <tr>
        <td style="padding: 20px; text-align: center; background: #f8f9fa;">
          <p style="font-size: 14px; color: #666; margin: 0;">
            <strong>Plus ${quantity - 2} more QR codes!</strong><br/>
            Download the complete PDF below to view all ${quantity} codes.
          </p>
        </td>
      </tr>
    `;
  } else {
    // Show all QR codes inline for small orders (single, twopack)
    qrRows = items.map((item, index) => `
      <tr>
        <td style="padding: 20px; text-align: center; border-bottom: 1px solid #ddd;">
          <p style="font-size: 18px; font-weight: bold; color: #333333; margin-bottom: 15px;">
            ${quantity > 1 ? `QR Code #${index + 1}` : 'Your QR Code'}
          </p>
          <img 
            src="cid:qr_code_${index}" 
            alt="QR Code ${index + 1}" 
            style="
              width: 250px; 
              height: 250px; 
              margin: 15px auto; 
              display: block; 
              border: 3px solid #A6E22E; 
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            " 
          />
          <p style="font-size: 14px; color: #666666; margin: 15px 0 5px 0;">
            Activation Code:
          </p>
          <p style="
            font-family: 'Courier New', Courier, monospace; 
            font-size: 16px; 
            font-weight: bold; 
            color: #333333; 
            background: #f5f5f5; 
            padding: 10px 20px; 
            border-radius: 4px; 
            display: inline-block;
            margin: 5px 0 20px 0;
            letter-spacing: 2px;
          ">
            ${item.activationCode}
          </p>
          <br/>
          <a 
            href="${item.setupUrl}" 
            style="
              display: inline-block; 
              padding: 12px 24px; 
              background: #A6E22E; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px; 
              margin-top: 15px; 
              font-weight: bold; 
              font-size: 14px;
              box-shadow: 0 2px 4px rgba(166, 226, 46, 0.3);
            "
          >
            📱 Activate This Magnet
          </a>
        </td>
      </tr>
    `).join('');
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #A6E22E; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f5f5f5; padding: 30px; }
        .footer { background: #272822; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; }
        .instructions { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .qr-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
        .download-button {
          display: inline-block;
          padding: 15px 30px;
          background: #272822;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          font-size: 16px;
          margin: 20px 0;
        }
        ol { text-align: left; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to UpKeepQR!</h1>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>Your QR magnet${quantity > 1 ? 's are' : ' is'} ready! Below ${quantity > 1 ? 'are' : 'is'} your unique QR code${quantity > 1 ? 's' : ''} and activation link${quantity > 1 ? 's' : ''}.</p>
          
          <div class="instructions">
            <h3>📱 How to Activate Your Magnet${quantity > 1 ? 's' : ''}:</h3>
            <ol>
              <li><strong>Scan the QR code below</strong> with your phone camera (QR code${quantity > 1 ? 's are' : ' is'} displayed in this email)</li>
              <li><strong>Or click the "Activate" button</strong> under each QR code</li>
              <li><strong>Complete the setup form</strong> (your info will be pre-filled)</li>
              <li><strong>Receive personalized maintenance reminders</strong> for your home</li>
            </ol>
            <p><em>Your QR code${quantity > 1 ? 's are' : ' is'} displayed below. You can also download a PDF with all your codes for printing.</em></p>
          </div>
          
          <table class="qr-table">
            ${qrRows}
          </table>
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="${downloadUrl}" class="download-button">📥 Download All QR Codes (PDF)</a>
          </p>
          
          <p style="margin-top: 30px;"><strong>Order ID:</strong> ${orderId}</p>
          <p>Need help? Contact us at support@upkeepqr.com</p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} UpKeepQR. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    from: FROM_EMAIL,
    subject,
    html,
    attachments  // Include CID attachments for inline QR images
  });
}

/**
 * Send order notification to admin
 */
export async function sendAdminOrderNotification(
  orderId: string,
  customerName: string,
  customerEmail: string,
  amountPaid: string,
  quantity: number,
  sku: string
): Promise<boolean> {
  const subject = `New Order: ${orderId} - $${amountPaid}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: monospace; color: #333333; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; background: #f5f5f5; border: 2px solid #A6E22E; }
        .detail { margin: 10px 0; padding: 10px; background: white; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>🎉 New UpKeepQR Order</h2>
        
        <div class="detail">
          <strong>Order ID:</strong> ${orderId}<br>
          <strong>Customer:</strong> ${customerName}<br>
          <strong>Email:</strong> ${customerEmail}<br>
          <strong>Amount:</strong> $${amountPaid}<br>
          <strong>SKU:</strong> ${sku}<br>
          <strong>Quantity:</strong> ${quantity} QR code${quantity > 1 ? 's' : ''}<br>
          <strong>Time:</strong> ${new Date().toLocaleString()}
        </div>
        
        <p>Confirmation and welcome emails have been sent to the customer.</p>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: 'support@upkeepqr.com',
    from: FROM_EMAIL,
    subject,
    html
  });
}

/**
 * Send error alert to admin
 */
export async function sendAdminErrorAlert(
  errorType: string,
  errorMessage: string,
  context: Record<string, any>
): Promise<boolean> {
  const subject = `UpKeepQR Error: ${errorType}`;
  
  const contextHtml = Object.entries(context)
    .map(([key, value]) => `<strong>${key}:</strong> ${JSON.stringify(value)}<br>`)
    .join('');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: monospace; color: #333333; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; background: #fff5f5; border: 2px solid #ff0000; }
        .error { background: #ffeeee; padding: 15px; margin: 15px 0; border-left: 4px solid #ff0000; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>❌ Error Alert</h2>
        
        <div class="error">
          <strong>Error Type:</strong> ${errorType}<br>
          <strong>Message:</strong> ${errorMessage}<br>
          <strong>Time:</strong> ${new Date().toISOString()}<br><br>
          ${contextHtml}
        </div>
        
        <p>Please investigate this error in the system logs.</p>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: 'support@upkeepqr.com',
    from: FROM_EMAIL,
    subject,
    html
  });
}

/**
 * HTML escape function for email template security
 * Prevents HTML injection in user-provided data
 */
function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Send setup confirmation email to customer
 * Called after household setup completes successfully
 */
export async function sendSetupConfirmationEmail(
  customerEmail: string,
  customerName: string,
  householdId: string,
  homeDetails: {
    address: string;
    homeType?: string;
    sqft?: number;
  }
): Promise<void> {
  try {
    const msg = {
      to: customerEmail,
      from: process.env.FROM_EMAIL || 'noreply@upkeepqr.com',
      replyTo: process.env.SUPPORT_EMAIL || 'support@upkeepqr.com',
      subject: 'Your Home Profile is Ready! - UpKeepQR',
      categories: ['customer_setup_confirmation'],
      text: `
Hi ${customerName},

Great news! Your home maintenance profile is now set up and ready.

Home Details:
- Address: ${homeDetails.address}
${homeDetails.homeType ? `- Home Type: ${homeDetails.homeType}` : ''}
${homeDetails.sqft ? `- Square Footage: ${Number(homeDetails.sqft).toLocaleString()} sq ft` : ''}

What's Next:
You'll start receiving personalized maintenance reminders to help keep your home in top condition. These timely reminders will help you stay on top of important tasks like HVAC filter changes, seasonal maintenance, and more.

Questions or need help? Reply to this email or contact us at support@upkeepqr.com.

Best regards,
The UpKeepQR Team
`.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Home Profile is Ready</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                Your Home Profile is Ready!
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hi <strong>${escapeHtml(customerName)}</strong>,
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Great news! Your home maintenance profile is now set up and ready to help you keep your home in top condition.
              </p>
              
              <!-- Home Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa; border-radius: 6px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <h2 style="color: #667eea; margin: 0 0 15px; font-size: 18px; font-weight: 600;">
                      Your Home Details
                    </h2>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding: 5px 0;">
                          <strong>Address:</strong> ${escapeHtml(homeDetails.address)}
                        </td>
                      </tr>
                      ${homeDetails.homeType ? `
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding: 5px 0;">
                          <strong>Home Type:</strong> ${escapeHtml(homeDetails.homeType)}
                        </td>
                      </tr>
                      ` : ''}
                      ${homeDetails.sqft ? `
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding: 5px 0;">
                          <strong>Square Footage:</strong> ${Number(homeDetails.sqft).toLocaleString()} sq ft
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- What's Next -->
              <h2 style="color: #333333; margin: 0 0 15px; font-size: 20px; font-weight: 600;">
                What's Next?
              </h2>
              
              <ul style="color: #666666; font-size: 15px; line-height: 1.8; margin: 0 0 30px; padding-left: 20px;">
                <li>You'll start receiving <strong>personalized maintenance reminders</strong></li>
                <li>Get timely alerts for <strong>HVAC filter changes</strong></li>
                <li>Never miss important <strong>seasonal maintenance tasks</strong></li>
                <li>Keep your home running smoothly year-round</li>
              </ul>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="https://upkeepqr.com" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Learn More About UpKeepQR
                    </a>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="color: #999999; font-size: 14px; margin: 0 0 10px;">
                Questions? We're here to help!
              </p>
              <p style="color: #666666; font-size: 14px; margin: 0;">
                Email us at <a href="mailto:support@upkeepqr.com" style="color: #667eea; text-decoration: none;">support@upkeepqr.com</a>
              </p>
              <p style="color: #999999; font-size: 12px; margin: 15px 0 0;">
                © ${new Date().getFullYear()} UpKeepQR. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    };

    await mailService.send(msg);
    console.log(`✅ Setup confirmation email sent to ${customerEmail}`);
    
  } catch (error) {
    console.error('❌ Failed to send setup confirmation email:', error);
    throw error;
  }
}

/**
 * Send notification to admin about new household setup
 * Called after household setup completes successfully
 */
export async function sendAdminSetupNotification(
  householdName: string,
  householdEmail: string,
  householdId: string,
  orderId: string | null,
  homeDetails: {
    address: string;
    city?: string;
    state?: string;
    zip?: string;
    homeType?: string;
    sqft?: number;
    hvacType?: string;
    waterHeaterType?: string;
  }
): Promise<void> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'support@upkeepqr.com';
    const baseUrl = process.env.BASE_URL || 'https://upkeepqr.com';
    
    const msg = {
      to: adminEmail,
      from: process.env.FROM_EMAIL || 'noreply@upkeepqr.com',
      subject: `New Home Setup Completed - ${householdName}`,
      categories: ['admin_setup_notification'],
      text: `
New Household Setup Completed

Customer Information:
- Name: ${householdName}
- Email: ${householdEmail}
- Household ID: ${householdId}
${orderId ? `- Order ID: ${orderId}` : ''}

Home Details:
- Address: ${homeDetails.address}
${homeDetails.city ? `- City: ${homeDetails.city}` : ''}
${homeDetails.state ? `- State: ${homeDetails.state}` : ''}
${homeDetails.zip ? `- ZIP: ${homeDetails.zip}` : ''}
${homeDetails.homeType ? `- Home Type: ${homeDetails.homeType}` : ''}
${homeDetails.sqft ? `- Square Footage: ${Number(homeDetails.sqft).toLocaleString()} sq ft` : ''}
${homeDetails.hvacType ? `- HVAC Type: ${homeDetails.hvacType}` : ''}
${homeDetails.waterHeaterType ? `- Water Heater: ${homeDetails.waterHeaterType}` : ''}

View in Admin Panel:
${baseUrl}/admin/setup-forms/${householdId}

Setup completed at: ${new Date().toLocaleString()}
`.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Home Setup Completed</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #10b981; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                New Home Setup Completed
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 30px;">
              
              <!-- Customer Info -->
              <h2 style="color: #333333; margin: 0 0 15px; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                Customer Information
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 8px 0; width: 180px;">
                    <strong>Name:</strong>
                  </td>
                  <td style="color: #333333; font-size: 14px; padding: 8px 0;">
                    ${escapeHtml(householdName)}
                  </td>
                </tr>
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 8px 0;">
                    <strong>Email:</strong>
                  </td>
                  <td style="color: #333333; font-size: 14px; padding: 8px 0;">
                    <a href="mailto:${householdEmail}" style="color: #10b981; text-decoration: none;">${escapeHtml(householdEmail)}</a>
                  </td>
                </tr>
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 8px 0;">
                    <strong>Household ID:</strong>
                  </td>
                  <td style="color: #333333; font-size: 14px; padding: 8px 0; font-family: monospace;">
                    ${escapeHtml(householdId)}
                  </td>
                </tr>
                ${orderId ? `
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 8px 0;">
                    <strong>Order ID:</strong>
                  </td>
                  <td style="color: #333333; font-size: 14px; padding: 8px 0; font-family: monospace;">
                    ${escapeHtml(orderId)}
                  </td>
                </tr>
                ` : ''}
              </table>
              
              <!-- Home Details -->
              <h2 style="color: #333333; margin: 0 0 15px; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                Home Details
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 8px 0; width: 180px;">
                    <strong>Address:</strong>
                  </td>
                  <td style="color: #333333; font-size: 14px; padding: 8px 0;">
                    ${escapeHtml(homeDetails.address)}
                  </td>
                </tr>
                ${homeDetails.city ? `
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 8px 0;">
                    <strong>City:</strong>
                  </td>
                  <td style="color: #333333; font-size: 14px; padding: 8px 0;">
                    ${escapeHtml(homeDetails.city)}
                  </td>
                </tr>
                ` : ''}
                ${homeDetails.state ? `
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 8px 0;">
                    <strong>State:</strong>
                  </td>
                  <td style="color: #333333; font-size: 14px; padding: 8px 0;">
                    ${escapeHtml(homeDetails.state)}
                  </td>
                </tr>
                ` : ''}
                ${homeDetails.zip ? `
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 8px 0;">
                    <strong>ZIP Code:</strong>
                  </td>
                  <td style="color: #333333; font-size: 14px; padding: 8px 0;">
                    ${escapeHtml(homeDetails.zip)}
                  </td>
                </tr>
                ` : ''}
                ${homeDetails.homeType ? `
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 8px 0;">
                    <strong>Home Type:</strong>
                  </td>
                  <td style="color: #333333; font-size: 14px; padding: 8px 0;">
                    ${escapeHtml(homeDetails.homeType)}
                  </td>
                </tr>
                ` : ''}
                ${homeDetails.sqft ? `
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 8px 0;">
                    <strong>Square Footage:</strong>
                  </td>
                  <td style="color: #333333; font-size: 14px; padding: 8px 0;">
                    ${Number(homeDetails.sqft).toLocaleString()} sq ft
                  </td>
                </tr>
                ` : ''}
                ${homeDetails.hvacType ? `
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 8px 0;">
                    <strong>HVAC Type:</strong>
                  </td>
                  <td style="color: #333333; font-size: 14px; padding: 8px 0;">
                    ${escapeHtml(homeDetails.hvacType)}
                  </td>
                </tr>
                ` : ''}
                ${homeDetails.waterHeaterType ? `
                <tr>
                  <td style="color: #666666; font-size: 14px; padding: 8px 0;">
                    <strong>Water Heater:</strong>
                  </td>
                  <td style="color: #333333; font-size: 14px; padding: 8px 0;">
                    ${escapeHtml(homeDetails.waterHeaterType)}
                  </td>
                </tr>
                ` : ''}
              </table>
              
              <!-- Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${baseUrl}/admin/setup-forms/${householdId}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 15px; font-weight: 600;">
                      View in Admin Panel →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #999999; font-size: 13px; text-align: center; margin: 20px 0 0;">
                Setup completed at ${new Date().toLocaleString()}
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                UpKeepQR Admin Notification System
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    };

    await mailService.send(msg);
    console.log(`✅ Admin notification sent for household ${householdId}`);
    
  } catch (error) {
    console.error('❌ Failed to send admin notification:', error);
    throw error;
  }
}
