import { Router, Request, Response } from "express";
import { storage } from "../../storage.js";
import { adminProRequestFiltersSchema, updateProRequestStatusSchema, createNoteSchema } from "@shared/schema";
import { createAuditLog } from "./utils.js";
import { authenticateAgent } from "../../middleware/auth.js";

const router = Router();

/**
 * GET / - Get all pro requests with filtering and pagination (admin)
 */
router.get("/", authenticateAgent, async (req: Request, res: Response) => {
  try {
    // Parse and validate query parameters FIRST
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

    // Only log audit after validation succeeds
    await createAuditLog(req, '/api/admin/pro-requests');

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
 * GET /:id - Get pro request by ID with full details (admin)
 */
router.get("/:id", authenticateAgent, async (req: Request, res: Response) => {
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
 * PATCH /:id/status - Update pro request status (admin)
 */
router.patch("/:id/status", authenticateAgent, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateProRequestStatusSchema.parse(req.body);
    
    // Fetch current state BEFORE update for accurate audit trail
    const currentRequest = await storage.getProRequest(id);
    if (!currentRequest) {
      return res.status(404).json({ error: "Pro request not found" });
    }

    const updatedRequest = await storage.updateProRequestStatus(
      id,
      validatedData.status,
      validatedData.providerAssigned
    );
    
    if (!updatedRequest) {
      return res.status(404).json({ error: "Pro request not found" });
    }

    // Create audit event with accurate old/new status
    await storage.createAuditEvent({
      requestId: id,
      actor: 'admin',
      type: 'status_updated',
      data: {
        oldStatus: currentRequest.status,
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
 * POST /:id/notes - Create internal note for pro request (admin)
 */
router.post("/:id/notes", authenticateAgent, async (req: Request, res: Response) => {
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
 * GET /:id/history - Get audit history for pro request (admin)
 */
router.get("/:id/history", authenticateAgent, async (req: Request, res: Response) => {
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
