import { MailService, MailDataRequired } from '@sendgrid/mail';
import type { AttachmentData } from '@sendgrid/helpers/classes/attachment';
import { getEmailLogoHtml } from './emailBranding.js';

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
const FROM_EMAIL: string = process.env.FROM_EMAIL || 'noreply@maintcue.com';
const ADMIN_EMAIL: string = process.env.ADMIN_EMAIL || 'admin@maintcue.com';

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
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .footer { background: #f9fafb; color: #6b7280; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="margin-bottom: 8px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">Maint</span><span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #1E3A5F;">Cue</span>
          </div>
          <p style="margin: 0; opacity: 0.9;">Service Request Confirmed</p>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Thank you for submitting your ${trade} service request. Our team will review it and connect you with a qualified professional.</p>
        </div>
        <div class="footer">
          <p style="margin: 0 0 8px 0;"><span style="font-size: 18px; font-weight: 700; letter-spacing: -0.5px;"><span style="color: #10B981;">Maint</span><span style="color: #1E3A5F;">Cue</span></span></p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
          <p style="margin: 8px 0 0 0;"><a href="https://maintcue.com" style="color: #10B981; text-decoration: none;">maintcue.com</a> | <a href="mailto:support@maintcue.com" style="color: #10B981; text-decoration: none;">support@maintcue.com</a></p>
        </div>
      </div>
    </body>
    </html>
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
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .detail { margin: 15px 0; padding: 15px; background: #f9fafb; border-left: 4px solid #10b981; border-radius: 0 4px 4px 0; }
        .footer { background: #f9fafb; color: #6b7280; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="margin-bottom: 8px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">Maint</span><span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #1E3A5F;">Cue</span>
          </div>
          <p style="margin: 0; opacity: 0.9;">New Service Request</p>
        </div>
        <div class="content">
          <div class="detail">
            <strong>Customer:</strong> ${userName}<br>
            <strong>Email:</strong> ${userEmail}<br>
            <strong>Request ID:</strong> ${requestId}<br>
            <strong>Service:</strong> ${trade}
          </div>
        </div>
        <div class="footer">
          <p style="margin: 0 0 8px 0;"><span style="font-size: 18px; font-weight: 700; letter-spacing: -0.5px;"><span style="color: #10B981;">Maint</span><span style="color: #1E3A5F;">Cue</span></span></p>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
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
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f5f5f5; padding: 30px; }
        .footer { background: #f9fafb; color: #6b7280; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; border-top: 1px solid #e5e7eb; }
        .detail { margin: 15px 0; padding: 15px; background: white; border-left: 4px solid #10b981; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="margin-bottom: 8px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">Maint</span><span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #1E3A5F;">Cue</span>
          </div>
          <p style="margin: 0; opacity: 0.9;">Payment Confirmed!</p>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>Thank you for your MaintCue purchase! Your payment has been successfully processed.</p>
          
          <div class="detail">
            <strong>Order ID:</strong> ${orderId}<br>
            <strong>Amount Paid:</strong> $${amountPaid}<br>
            <strong>Quantity:</strong> ${quantity} QR code${quantity > 1 ? 's' : ''}
          </div>
          
          <p>You'll receive a separate email with your QR codes and activation instructions shortly.</p>
          
          <p>If you have any questions, please contact us at support@maintcue.com</p>
        </div>
        <div class="footer">
          <p style="margin: 0 0 8px 0;"><span style="font-size: 18px; font-weight: 700; letter-spacing: -0.5px;"><span style="color: #10B981;">Maint</span><span style="color: #1E3A5F;">Cue</span></span></p>
          <p style="margin: 0;">© ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
          <p style="margin: 8px 0 0 0;"><a href="https://maintcue.com" style="color: #10B981; text-decoration: none;">maintcue.com</a> | <a href="mailto:support@maintcue.com" style="color: #10B981; text-decoration: none;">support@maintcue.com</a></p>
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
  
  const baseUrl = process.env.PUBLIC_BASE_URL || 'https://maintcue.com';
  const downloadUrl = `${baseUrl}/api/orders/${orderId}/qr-codes`;
  
  const subject = `Welcome to MaintCue! Your QR Magnet${quantity > 1 ? 's Are' : ' Is'} Ready`;
  
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
              border: 3px solid #10b981; 
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
              background: #10b981; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px; 
              margin-top: 15px; 
              font-weight: bold; 
              font-size: 14px;
              box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
            "
          >
            Activate This Magnet
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
              border: 3px solid #10b981; 
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
              background: #10b981; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px; 
              margin-top: 15px; 
              font-weight: bold; 
              font-size: 14px;
              box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
            "
          >
            Activate This Magnet
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
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f5f5f5; padding: 30px; }
        .footer { background: #f9fafb; color: #6b7280; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; border-top: 1px solid #e5e7eb; }
        .instructions { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .qr-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
        .download-button {
          display: inline-block;
          padding: 15px 30px;
          background: #059669;
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
          <div style="margin-bottom: 8px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">Maint</span><span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #1E3A5F;">Cue</span>
          </div>
          <p style="margin: 0; opacity: 0.9;">Welcome to MaintCue!</p>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>Your QR magnet${quantity > 1 ? 's are' : ' is'} ready! Below ${quantity > 1 ? 'are' : 'is'} your unique QR code${quantity > 1 ? 's' : ''} and activation link${quantity > 1 ? 's' : ''}.</p>
          
          <div class="instructions">
            <h3>How to Activate Your Magnet${quantity > 1 ? 's' : ''}:</h3>
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
            <a href="${downloadUrl}" class="download-button">Download All QR Codes (PDF)</a>
          </p>
          
          <p style="margin-top: 30px;"><strong>Order ID:</strong> ${orderId}</p>
          <p>Need help? Contact us at support@maintcue.com</p>
        </div>
        <div class="footer">
          <p style="margin: 0 0 8px 0;"><span style="font-size: 18px; font-weight: 700; letter-spacing: -0.5px;"><span style="color: #10B981;">Maint</span><span style="color: #1E3A5F;">Cue</span></span></p>
          <p style="margin: 0;">© ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
          <p style="margin: 8px 0 0 0;"><a href="https://maintcue.com" style="color: #10B981; text-decoration: none;">maintcue.com</a> | <a href="mailto:support@maintcue.com" style="color: #10B981; text-decoration: none;">support@maintcue.com</a></p>
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
        .container { max-width: 600px; margin: 20px auto; padding: 20px; background: #f5f5f5; border: 2px solid #10b981; }
        .detail { margin: 10px 0; padding: 10px; background: white; }
      </style>
    </head>
    <body>
      <div class="container">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <div style="margin-bottom: 8px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">Maint</span><span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #1E3A5F;">Cue</span>
          </div>
          <p style="margin: 0; opacity: 0.9;">New MaintCue Order</p>
        </div>
        
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
        
        <div style="background: #f9fafb; color: #6b7280; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px 0;"><span style="font-size: 18px; font-weight: 700; letter-spacing: -0.5px;"><span style="color: #10B981;">Maint</span><span style="color: #1E3A5F;">Cue</span></span></p>
          <p style="margin: 0;">© ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
          <p style="margin: 8px 0 0 0;"><a href="https://maintcue.com" style="color: #10B981; text-decoration: none;">maintcue.com</a> | <a href="mailto:support@maintcue.com" style="color: #10B981; text-decoration: none;">support@maintcue.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: 'support@maintcue.com',
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
  const subject = `MaintCue Error: ${errorType}`;
  
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
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <div style="margin-bottom: 8px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">Maint</span><span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #1E3A5F;">Cue</span>
          </div>
          <p style="margin: 0; opacity: 0.9;">Error Alert</p>
        </div>
        
        <div class="error">
          <strong>Error Type:</strong> ${errorType}<br>
          <strong>Message:</strong> ${errorMessage}<br>
          <strong>Time:</strong> ${new Date().toISOString()}<br><br>
          ${contextHtml}
        </div>
        
        <p>Please investigate this error in the system logs.</p>
        
        <div style="background: #f9fafb; color: #6b7280; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px 0;"><span style="font-size: 18px; font-weight: 700; letter-spacing: -0.5px;"><span style="color: #10B981;">Maint</span><span style="color: #1E3A5F;">Cue</span></span></p>
          <p style="margin: 0;">© ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
          <p style="margin: 8px 0 0 0;"><a href="https://maintcue.com" style="color: #10B981; text-decoration: none;">maintcue.com</a> | <a href="mailto:support@maintcue.com" style="color: #10B981; text-decoration: none;">support@maintcue.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: 'support@maintcue.com',
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
      from: process.env.FROM_EMAIL || 'noreply@maintcue.com',
      replyTo: process.env.SUPPORT_EMAIL || 'support@maintcue.com',
      subject: 'Your Home Profile is Ready! - MaintCue',
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

Questions or need help? Reply to this email or contact us at support@maintcue.com.

Best regards,
The MaintCue Team
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
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <div style="margin-bottom: 8px;">
                <span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">Maint</span><span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #1E3A5F;">Cue</span>
              </div>
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Your Home Profile is Ready!</p>
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
                    <h2 style="color: #10b981; margin: 0 0 15px; font-size: 18px; font-weight: 600;">
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
                    <a href="https://maintcue.com" style="display: inline-block; background: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Learn More About MaintCue
                    </a>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">
              <p style="margin: 0 0 8px 0;"><span style="font-size: 18px; font-weight: 700; letter-spacing: -0.5px;"><span style="color: #10B981;">Maint</span><span style="color: #1E3A5F;">Cue</span></span></p>
              <p style="margin: 0;">© ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
              <p style="margin: 8px 0 0 0;"><a href="https://maintcue.com" style="color: #10B981; text-decoration: none;">maintcue.com</a> | <a href="mailto:support@maintcue.com" style="color: #10B981; text-decoration: none;">support@maintcue.com</a></p>
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
    const adminEmail = process.env.ADMIN_EMAIL || 'support@maintcue.com';
    const baseUrl = process.env.BASE_URL || 'https://maintcue.com';
    
    const msg = {
      to: adminEmail,
      from: process.env.FROM_EMAIL || 'noreply@maintcue.com',
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
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <div style="margin-bottom: 8px;">
                <span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">Maint</span><span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #1E3A5F;">Cue</span>
              </div>
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">New Home Setup Completed</p>
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
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">
              <p style="margin: 0 0 8px 0;"><span style="font-size: 18px; font-weight: 700; letter-spacing: -0.5px;"><span style="color: #10B981;">Maint</span><span style="color: #1E3A5F;">Cue</span></span></p>
              <p style="margin: 0;">© ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
              <p style="margin: 8px 0 0 0;"><a href="https://maintcue.com" style="color: #10B981; text-decoration: none;">maintcue.com</a> | <a href="mailto:support@maintcue.com" style="color: #10B981; text-decoration: none;">support@maintcue.com</a></p>
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

/**
 * Send subscription welcome email to customer with QR codes
 */
export async function sendSubscriptionWelcomeEmail(
  customerEmail: string,
  customerName: string,
  planName: string,
  amountPaid: string,
  orderId?: string,
  qrCodes?: Array<{ code: string; qrUrl: string; setupUrl: string }>
): Promise<boolean> {
  const subject = `Welcome to MaintCue - ${planName} Subscription Activated`;
  const baseUrl = process.env.PUBLIC_BASE_URL || 'https://maintcue.com';
  
  // Build QR codes section if provided
  let qrCodesHtml = '';
  let qrCodesText = '';
  let qrAttachments: any[] = [];
  
  if (qrCodes && qrCodes.length > 0) {
    const downloadUrl = orderId ? `${baseUrl}/api/orders/${orderId}/qr-codes` : '#';
    
    // Prepare CID attachments for QR code images (limit to first 10 for email size)
    const itemsToAttach = qrCodes.length > 10 ? qrCodes.slice(0, 2) : qrCodes;
    
    qrAttachments = itemsToAttach.map((qr, index) => {
      if (!qr.qrUrl || !qr.qrUrl.includes('base64,')) {
        console.warn(`Invalid QR code image format for item ${index}`);
        return null;
      }
      
      try {
        const base64Data = qr.qrUrl.split(',')[1];
        return {
          filename: `qr-code-${index + 1}.png`,
          content: base64Data,
          encoding: 'base64',
          type: 'image/png',
          content_id: `qr_code_${index}`,
          disposition: 'inline'
        };
      } catch (error) {
        console.error(`Error processing QR code ${index}:`, error);
        return null;
      }
    }).filter(Boolean);
    
    // HTML section for QR codes
    const qrItemsHtml = itemsToAttach.map((qr, index) => `
      <div style="text-align: center; margin: 20px 0; padding: 20px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h4 style="margin: 0 0 10px 0; color: #166534;">
          ${qrCodes.length > 1 ? `QR Code #${index + 1}` : 'Your QR Code'}
        </h4>
        <img 
          src="cid:qr_code_${index}" 
          alt="QR Code ${index + 1}" 
          style="width: 200px; height: 200px; border: 2px solid #10b981; border-radius: 8px; margin-bottom: 15px;"
        />
        <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
          <strong style="color: #059669;">Activation Code:</strong><br>
          <code style="font-size: 16px; letter-spacing: 1px; color: #166534;">${qr.code}</code>
        </div>
        <a 
          href="${qr.setupUrl}" 
          style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;"
        >
          Activate This QR Code
        </a>
      </div>
    `).join('');
    
    // Show note if there are more QR codes than displayed
    const remainingCodesNote = qrCodes.length > 2 ? `
      <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin-top: 15px; text-align: center;">
        <strong>Plus ${qrCodes.length - 2} more QR codes!</strong><br/>
        <span style="font-size: 14px;">Download all your QR codes below.</span>
      </div>
    ` : '';
    
    qrCodesHtml = `
      <div style="margin: 30px 0; padding: 30px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h3 style="margin-top: 0; color: #166534; text-align: center;">Your QR Codes Are Ready!</h3>
        <p style="text-align: center;">Scan or click to activate each QR code and start tracking your home maintenance:</p>
        
        ${qrItemsHtml}
        ${remainingCodesNote}
        
        ${orderId ? `
          <div style="text-align: center; margin-top: 20px;">
            <a 
              href="${downloadUrl}" 
              style="display: inline-block; background: #166534; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;"
            >
              Download All QR Codes (PDF)
            </a>
          </div>
        ` : ''}
        
        <div style="margin-top: 20px; padding: 15px; background: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px;">
          <strong style="color: #065f46;">Quick Setup:</strong>
          <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #064e3b;">
            <li>Scan each QR code with your phone camera</li>
            <li>Follow the setup wizard to register your home</li>
            <li>Attach QR magnets to your appliances</li>
            <li>Receive automated maintenance reminders</li>
          </ol>
        </div>
      </div>
    `;
    
    // Plain text version
    qrCodesText = `

YOUR QR CODES
==============

You have ${qrCodes.length} QR code${qrCodes.length > 1 ? 's' : ''} included in your subscription.

${qrCodes.map((qr, i) => `
QR Code #${i + 1}:
Activation Code: ${qr.code}
Setup Link: ${qr.setupUrl}
`).join('\n')}

${orderId ? `Download all QR codes: ${downloadUrl}` : ''}

Quick Setup:
1. Scan each QR code with your phone camera
2. Follow the setup wizard to register your home
3. Attach QR magnets to your appliances
4. Receive automated maintenance reminders
`;
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; color: #6b7280; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; border: 1px solid #e5e7eb; border-top: none; }
        .button { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .feature-list { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .feature-list li { margin: 10px 0; color: #166534; }
        .plan-badge { display: inline-block; background: #10b981; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="margin-bottom: 8px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">Maint</span><span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #1E3A5F;">Cue</span>
          </div>
          <p style="margin: 0; opacity: 0.9;">Welcome to MaintCue!</p>
        </div>
        <div class="content">
          <p>Hi ${customerName || 'there'},</p>
          
          <p>Thank you for subscribing to MaintCue! Your <span class="plan-badge">${planName}</span> subscription is now active.</p>
          
          <div class="feature-list">
            <h3 style="margin-top: 0; color: #166534;">What's included:</h3>
            <ul>
              <li>Personalized maintenance task scheduling</li>
              <li>Smart reminders via email and SMS</li>
              <li>Appliance tracking with warranty alerts</li>
              <li>Maintenance history and cost tracking</li>
              <li>Access to professional service providers</li>
            </ul>
          </div>
          
          ${qrCodesHtml}
          
          ${!qrCodes || qrCodes.length === 0 ? `
            <h3>Next Steps:</h3>
            <ol>
              <li><strong>Order Your QR Magnet</strong> - Place it on your fridge for easy access to your home profile</li>
              <li><strong>Set Up Your Home Profile</strong> - Add your home details to get personalized maintenance tasks</li>
              <li><strong>Add Your Appliances</strong> - Track warranties and maintenance schedules</li>
            </ol>
            
            <p style="text-align: center;">
              <a href="https://maintcue.com/order" class="button">Order Your QR Magnet</a>
            </p>
          ` : ''}
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            <strong>Subscription Details:</strong><br>
            Plan: ${planName}<br>
            Amount: $${amountPaid}/year${qrCodes && qrCodes.length > 0 ? `<br>QR Codes: ${qrCodes.length}` : ''}
          </p>
          
          <p>Questions? Reply to this email or contact us at support@maintcue.com</p>
        </div>
        <div class="footer">
          <p style="margin: 0 0 8px 0;"><span style="font-size: 18px; font-weight: 700; letter-spacing: -0.5px;"><span style="color: #10B981;">Maint</span><span style="color: #1E3A5F;">Cue</span></span></p>
          <p style="margin: 0;">© ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
          <p style="margin: 8px 0 0 0;"><a href="https://maintcue.com" style="color: #10B981; text-decoration: none;">maintcue.com</a> | <a href="mailto:support@maintcue.com" style="color: #10B981; text-decoration: none;">support@maintcue.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `Welcome to MaintCue - ${planName} Subscription Activated

Hi ${customerName || 'there'},

Thank you for subscribing to MaintCue! Your ${planName} subscription is now active.

What's included:
- Personalized maintenance task scheduling
- Smart reminders via email and SMS
- Appliance tracking with warranty alerts
- Maintenance history and cost tracking
- Access to professional service providers
${qrCodesText}
Subscription Details:
Plan: ${planName}
Amount: $${amountPaid}/year${qrCodes && qrCodes.length > 0 ? `\nQR Codes: ${qrCodes.length}` : ''}

Questions? Contact us at support@maintcue.com

© ${new Date().getFullYear()} MaintCue. All rights reserved.
`;

  return sendEmail({
    to: customerEmail,
    from: FROM_EMAIL,
    subject,
    html,
    text,
    attachments: qrAttachments.length > 0 ? qrAttachments : undefined
  });
}

/**
 * Send subscription notification to admin with QR count
 */
export async function sendAdminSubscriptionNotification(
  customerEmail: string,
  customerName: string,
  planName: string,
  amountPaid: string,
  subscriptionId: string,
  qrCodeCount?: number
): Promise<boolean> {
  const subject = `New Subscription: ${planName} - $${amountPaid}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: monospace; color: #333333; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; background: #f5f5f5; border: 2px solid #10b981; }
        .detail { margin: 10px 0; padding: 10px; background: white; }
      </style>
    </head>
    <body>
      <div class="container">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <div style="margin-bottom: 8px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">Maint</span><span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #1E3A5F;">Cue</span>
          </div>
          <p style="margin: 0; opacity: 0.9;">New MaintCue Subscription</p>
        </div>
        
        <div class="detail">
          <strong>Plan:</strong> ${planName}<br>
          <strong>Customer:</strong> ${customerName}<br>
          <strong>Email:</strong> ${customerEmail}<br>
          <strong>Amount:</strong> $${amountPaid}/year<br>
          <strong>Subscription ID:</strong> ${subscriptionId}<br>
          ${qrCodeCount ? `<strong>QR Codes Generated:</strong> ${qrCodeCount}<br>` : ''}
          <strong>Time:</strong> ${new Date().toLocaleString()}
        </div>
        
        <p>Welcome email with ${qrCodeCount || 0} QR code${qrCodeCount !== 1 ? 's' : ''} has been sent to the customer.</p>
        
        <div style="background: #f9fafb; color: #6b7280; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px 0;"><span style="font-size: 18px; font-weight: 700; letter-spacing: -0.5px;"><span style="color: #10B981;">Maint</span><span style="color: #1E3A5F;">Cue</span></span></p>
          <p style="margin: 0;">© ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
          <p style="margin: 8px 0 0 0;"><a href="https://maintcue.com" style="color: #10B981; text-decoration: none;">maintcue.com</a> | <a href="mailto:support@maintcue.com" style="color: #10B981; text-decoration: none;">support@maintcue.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    subject,
    html
  });
}

export async function sendMagicLinkEmail(
  email: string,
  name: string,
  magicLink: string,
  isFirstTime: boolean = true
): Promise<boolean> {
  const subject = isFirstTime 
    ? 'Welcome to MaintCue! Access Your Dashboard'
    : 'Access Your MaintCue Dashboard';
  
  const greeting = isFirstTime
    ? `Welcome to MaintCue, ${name}!`
    : `Hi ${name},`;
  
  const message = isFirstTime
    ? `Your home maintenance dashboard is ready! Click the button below to access it and see your personalized maintenance schedule.`
    : `You requested access to your dashboard. Click the button below to continue.`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .logo { font-size: 28px; font-weight: bold; color: #10b981; }
        .content { background: #ffffff; border-radius: 12px; padding: 30px; border: 1px solid #e5e7eb; }
        h1 { color: #111827; font-size: 24px; margin: 0 0 16px 0; }
        p { color: #6b7280; margin: 0 0 16px 0; }
        .button-wrapper { text-align: center; margin: 32px 0; }
        .button { display: inline-block; background: #10b981; color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
        .note { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-top: 24px; }
        .note p { color: #166534; margin: 0; font-size: 14px; }
        .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
        .footer p { color: #9ca3af; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="margin-bottom: 8px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">Maint</span><span style="font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #1E3A5F;">Cue</span>
          </div>
          <p style="margin: 0; opacity: 0.9;">Access Your Dashboard</p>
        </div>
        
        <div class="content">
          <h1>${greeting}</h1>
          <p>${message}</p>
          
          <div class="button-wrapper">
            <a href="${magicLink}" class="button">Access Dashboard</a>
          </div>
          
          <div class="note">
            <p><strong>Note:</strong> This link will expire in 24 hours and can only be used once. If you didn't request this, you can safely ignore this email.</p>
          </div>
        </div>
        
        <div class="footer">
          <p style="margin: 0 0 8px 0;"><span style="font-size: 18px; font-weight: 700; letter-spacing: -0.5px;"><span style="color: #10B981;">Maint</span><span style="color: #1E3A5F;">Cue</span></span></p>
          <p style="margin: 0;">© ${new Date().getFullYear()} MaintCue. All rights reserved.</p>
          <p style="margin: 8px 0 0 0;"><a href="https://maintcue.com" style="color: #10B981; text-decoration: none;">maintcue.com</a> | <a href="mailto:support@maintcue.com" style="color: #10B981; text-decoration: none;">support@maintcue.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `${greeting}

${message}

Access your dashboard: ${magicLink}

This link will expire in 24 hours and can only be used once.
If you didn't request this, you can safely ignore this email.

---
MaintCue - Your Home's Maintenance, Automated
Questions? Reply to this email or visit maintcue.com/support`;
  
  return sendEmail({
    to: email,
    from: FROM_EMAIL,
    subject,
    html,
    text
  });
}
