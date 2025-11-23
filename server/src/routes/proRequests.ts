import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import sgMail from "@sendgrid/mail";
import { storage } from "../../storage.js";
import { createProRequestSchema } from "@shared/schema";

const router = Router();

// Configure SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@upkeepqr.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@upkeepqr.com';

// Rate limiting: 10 requests per 10 minutes per IP
const proRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many pro requests. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Send confirmation email to user
 */
async function sendUserConfirmationEmail(
  userEmail: string,
  userName: string,
  requestId: string,
  trackingCode: string,
  trade: string
): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.warn('⚠️ SendGrid not configured, skipping user confirmation email');
    return;
  }

  const tradeLabels: Record<string, string> = {
    roofing: 'Roofing',
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    hvac: 'HVAC',
    general: 'General Maintenance'
  };

  const msg = {
    to: userEmail,
    from: FROM_EMAIL,
    subject: `Your ${tradeLabels[trade] || trade} Service Request Received`,
    html: `
      <h2>Thank You for Your Request!</h2>
      <p>Hi ${userName},</p>
      <p>We've received your ${tradeLabels[trade] || trade} service request and will contact you shortly.</p>
      
      <h3>Request Details</h3>
      <p><strong>Tracking Code:</strong> ${trackingCode}</p>
      <p><strong>Request ID:</strong> ${requestId}</p>
      
      <p>A professional will review your request and contact you within 24 hours.</p>
      <p>If you have any questions, please reply to this email.</p>
      
      <p>Best regards,<br/>UpKeepQR Team</p>
    `,
    text: `
Thank You for Your Request!

Hi ${userName},

We've received your ${tradeLabels[trade] || trade} service request and will contact you shortly.

Request Details:
- Tracking Code: ${trackingCode}
- Request ID: ${requestId}

A professional will review your request and contact you within 24 hours.

Best regards,
UpKeepQR Team
    `
  };

  console.log('📧 Attempting to send user confirmation email:', {
    to: userEmail,
    from: FROM_EMAIL,
    subject: msg.subject
  });

  await sgMail.send(msg);
  console.log('✅ User confirmation email sent successfully');
}

/**
 * Send alert email to admin
 */
async function sendAdminAlertEmail(
  requestId: string,
  contactName: string,
  contactEmail: string,
  contactPhone: string,
  trade: string,
  urgency: string,
  description: string,
  address: string
): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.warn('⚠️ SendGrid not configured, skipping admin alert email');
    return;
  }

  const urgencyLabels: Record<string, string> = {
    emergency: '🚨 EMERGENCY',
    '24h': '⚡ 24 Hours',
    '3days': '📅 3 Days',
    flexible: '🕐 Flexible'
  };

  const tradeLabels: Record<string, string> = {
    roofing: 'Roofing',
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    hvac: 'HVAC',
    general: 'General Maintenance'
  };

  const msg = {
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    subject: `New Service Request: ${tradeLabels[trade] || trade} - ${urgencyLabels[urgency] || urgency}`,
    html: `
      <h2>New Professional Service Request</h2>
      
      <h3>Contact Information</h3>
      <p><strong>Name:</strong> ${contactName}</p>
      <p><strong>Email:</strong> <a href="mailto:${contactEmail}">${contactEmail}</a></p>
      <p><strong>Phone:</strong> <a href="tel:${contactPhone}">${contactPhone}</a></p>
      
      <h3>Service Details</h3>
      <p><strong>Trade:</strong> ${tradeLabels[trade] || trade}</p>
      <p><strong>Urgency:</strong> ${urgencyLabels[urgency] || urgency}</p>
      <p><strong>Request ID:</strong> ${requestId}</p>
      
      <h3>Service Address</h3>
      <p>${address}</p>
      
      <h3>Description</h3>
      <p>${description}</p>
      
      <hr/>
      <p><em>This is an automated notification from UpKeepQR.</em></p>
    `,
    text: `
New Professional Service Request

Contact Information:
- Name: ${contactName}
- Email: ${contactEmail}
- Phone: ${contactPhone}

Service Details:
- Trade: ${tradeLabels[trade] || trade}
- Urgency: ${urgencyLabels[urgency] || urgency}
- Request ID: ${requestId}

Service Address:
${address}

Description:
${description}

---
This is an automated notification from UpKeepQR.
    `
  };

  console.log('📧 Attempting to send admin alert email:', {
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    subject: msg.subject
  });

  await sgMail.send(msg);
  console.log('✅ Admin alert email sent successfully');
}

/**
 * POST /pro-requests
 * Create a new professional service request
 */
router.post("/", proRequestLimiter, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = createProRequestSchema.parse(req.body);
    
    // Create the pro request
    const proRequest = await storage.createProRequest(validatedData);

    console.log('✅ Pro request created:', {
      id: proRequest.id,
      trade: proRequest.trade,
      urgency: proRequest.urgency,
      email: proRequest.contactEmail
    });

    // Send email notifications (don't fail if email fails)
    try {
      const address = `${proRequest.addressLine1}${proRequest.addressLine2 ? ', ' + proRequest.addressLine2 : ''}, ${proRequest.city}, ${proRequest.state} ${proRequest.zip}`;
      
      // Send user confirmation
      await sendUserConfirmationEmail(
        proRequest.contactEmail,
        proRequest.contactName,
        proRequest.id,
        proRequest.publicTrackingCode,
        proRequest.trade
      );
      
      // Send admin alert
      await sendAdminAlertEmail(
        proRequest.id,
        proRequest.contactName,
        proRequest.contactEmail,
        proRequest.contactPhone,
        proRequest.trade,
        proRequest.urgency,
        proRequest.description,
        address
      );
    } catch (emailError) {
      console.error('❌ Email notification error:', emailError);
      // Don't fail the request if email fails
    }
    
    res.status(201).json({
      id: proRequest.id,
      publicTrackingCode: proRequest.publicTrackingCode,
      message: "Pro request created successfully. You will receive a confirmation email shortly."
    });
  } catch (error: any) {
    console.error("❌ Pro request creation error:", error);
    
    // Handle Zod validation errors
    if (error?.name === 'ZodError') {
      return res.status(400).json({
        error: "Invalid request data",
        details: error.errors.map((e: any) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    
    // Handle other errors
    res.status(500).json({ 
      error: "Failed to create pro request. Please try again." 
    });
  }
});

export default router;
