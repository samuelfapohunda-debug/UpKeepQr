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
export async function sendWelcomeEmailWithQR(
  customerEmail: string,
  customerName: string,
  orderId: string,
  qrCodes: Array<{ code: string; qrUrl: string; setupUrl: string }>
): Promise<boolean> {
  const subject = `Welcome to UpKeepQR - Your Activation Codes`;
  
  const qrCodesHtml = qrCodes.map((qr, index) => `
    <div style="margin: 30px 0; padding: 20px; background: white; border: 2px solid #A6E22E; border-radius: 8px; text-align: center;">
      <h3>QR Code #${index + 1}</h3>
      <img src="${qr.qrUrl}" alt="QR Code ${qr.code}" style="max-width: 250px; margin: 20px auto; display: block;" />
      <div style="font-size: 20px; font-weight: bold; margin: 10px 0; letter-spacing: 2px; color: #272822;">${qr.code}</div>
      <div style="font-size: 14px; color: #666; word-break: break-all;">${qr.setupUrl}</div>
    </div>
  `).join('');
  
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
        ol { text-align: left; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏡 Welcome to UpKeepQR!</h1>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>Your UpKeepQR codes are ready! Below are your unique QR codes and activation links.</p>
          
          <div class="instructions">
            <h3>📱 How to Activate Your QR Codes:</h3>
            <ol>
              <li>Scan each QR code with your phone camera</li>
              <li>Complete the setup form with your home information</li>
              <li>Attach the QR code sticker to your home in a visible location</li>
              <li>Service providers can now scan to access your home details</li>
            </ol>
          </div>
          
          ${qrCodesHtml}
          
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
    to: customerEmail,
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
