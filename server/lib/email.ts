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
            src="${item.qrCodeImage}" 
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
            src="${item.qrCodeImage}" 
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
    html
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
