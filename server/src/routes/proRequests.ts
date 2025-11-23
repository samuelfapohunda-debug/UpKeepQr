import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import sgMail from "@sendgrid/mail";
import { storage } from "../../storage.js";
import { createProRequestSchema, adminProRequestFiltersSchema, updateProRequestStatusSchema, createNoteSchema } from "@shared/schema";
import { createAuditLog } from "./utils.js";
import { authenticateAgent } from "../../middleware/auth.js";

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
  // Best-effort audit logging (don't abort request if logging fails)
  try {
    await createAuditLog(req, '/api/pro-requests');
  } catch (auditError) {
    console.warn('⚠️ Audit logging failed for pro-request:', auditError);
    // Continue processing request even if audit logging fails
  }
  
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

/**
 * GET /admin - Get all pro requests with filtering and pagination (admin)
 */
router.get("/admin", authenticateAgent, async (req: Request, res: Response) => {
  try {
    await createAuditLog(req, '/api/pro-requests/admin');
    
    // Parse and validate query parameters
    const filters = adminProRequestFiltersSchema.parse({
      status: req.query.status ? (Array.isArray(req.query.status) ? req.query.status : [req.query.status]) : undefined,
      trade: req.query.trade,
      urgency: req.query.urgency,
      zip: req.query.zip,
      providerAssigned: req.query.providerAssigned,
      q: req.query.q,
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 25,
      sortBy: req.query.sortBy || 'createdAt',
      sortDir: req.query.sortDir || 'desc'
    });

    const result = await storage.getAdminProRequests(filters);
    res.json(result);
  } catch (error: any) {
    console.error("❌ Admin pro-requests list error:", error);
    
    if (error?.name === 'ZodError') {
      return res.status(400).json({
        error: "Invalid filter parameters",
        details: error.errors.map((e: any) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    
    res.status(500).json({ error: "Failed to fetch pro requests" });
  }
});

/**
 * GET /admin/:id - Get pro request by ID with full details (admin)
 */
router.get("/admin/:id", authenticateAgent, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const proRequest = await storage.getProRequest(id);
    if (!proRequest) {
      return res.status(404).json({ error: "Pro request not found" });
    }

    // Return full details for admin
    res.json(proRequest);
  } catch (error: any) {
    console.error("❌ Admin pro-request get error:", error);
    res.status(500).json({ error: "Failed to fetch pro request" });
  }
});

/**
 * PATCH /admin/:id/status - Update pro request status (admin)
 */
router.patch("/admin/:id/status", authenticateAgent, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateProRequestStatusSchema.parse(req.body);
    
    const updatedRequest = await storage.updateProRequestStatus(
      id,
      validatedData.status,
      validatedData.providerAssigned
    );
    
    if (!updatedRequest) {
      return res.status(404).json({ error: "Pro request not found" });
    }

    // Create audit event for status update
    await storage.createAuditEvent({
      requestId: id,
      actor: 'admin',
      type: 'status_updated',
      data: {
        oldStatus: updatedRequest.status,
        newStatus: validatedData.status,
        providerAssigned: validatedData.providerAssigned
      }
    });

    res.json(updatedRequest);
  } catch (error: any) {
    console.error("❌ Admin pro-request status update error:", error);
    
    if (error?.name === 'ZodError') {
      return res.status(400).json({
        error: "Invalid status data",
        details: error.errors.map((e: any) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    
    res.status(500).json({ error: "Failed to update pro request status" });
  }
});

/**
 * POST /admin/:id/notes - Create internal note for pro request (admin)
 */
router.post("/admin/:id/notes", authenticateAgent, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = createNoteSchema.parse(req.body);
    
    // Check if pro request exists
    const proRequest = await storage.getProRequest(id);
    if (!proRequest) {
      return res.status(404).json({ error: "Pro request not found" });
    }

    const note = await storage.createNote({
      requestId: id,
      author: 'admin',
      message: validatedData.message
    });

    // Create audit event for note creation
    await storage.createAuditEvent({
      requestId: id,
      actor: 'admin',
      type: 'note_created',
      data: { noteId: note.id, message: validatedData.message }
    });

    res.status(201).json(note);
  } catch (error: any) {
    console.error("❌ Admin pro-request note creation error:", error);
    
    if (error?.name === 'ZodError') {
      return res.status(400).json({
        error: "Invalid note data",
        details: error.errors.map((e: any) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    
    res.status(500).json({ error: "Failed to create note" });
  }
});

/**
 * GET /admin/:id/history - Get audit history for pro request (admin)
 */
router.get("/admin/:id/history", authenticateAgent, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if pro request exists
    const proRequest = await storage.getProRequest(id);
    if (!proRequest) {
      return res.status(404).json({ error: "Pro request not found" });
    }

    const auditEvents = await storage.getAuditEventsByRequest(id);
    res.json(auditEvents);
  } catch (error: any) {
    console.error("❌ Admin pro-request history error:", error);
    res.status(500).json({ error: "Failed to fetch audit history" });
  }
});

export default router;
