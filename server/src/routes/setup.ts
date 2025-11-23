import { Router, Request, Response } from "express";
import { z } from "zod";
import { getUserFromAuth } from "../../middleware/auth";
import { storage } from "../../storage";
import { nanoid } from "nanoid";

const router = Router();

// Base validation schema (all fields optional initially)
const baseActivateSchema = z.object({
  // Personal details (from Onboarding form)
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  zip: z.string().min(5).max(10).optional(),
  homeType: z.string().optional(),
  
  // Optional admin flag
  skipWelcomeEmail: z.boolean().optional(),
});

router.post("/activate", async (req: Request, res: Response) => {
  try {
    console.log("📥 Received setup activation request:", req.body);
    console.log("🔑 Authorization header:", req.headers.authorization ? "Present" : "Missing");
    
    // Check if user is authenticated as admin
    const authUser = await getUserFromAuth(req);
    console.log("👤 Authenticated user:", authUser ? `${authUser.email} (${authUser.role})` : "None");
    
    const isAdmin = authUser && authUser.role === 'admin';
    const allowAdminCreation = process.env.ALLOW_ADMIN_SETUP_CREATION === 'true';
    const hasToken = !!req.body.token;
    
    console.log("🔍 Admin check breakdown:", {
      isAdmin,
      allowAdminCreation,
      hasToken,
      wouldBeAdminMode: isAdmin && allowAdminCreation && !hasToken
    });
    
    // Admin mode is only enabled if:
    // 1. User is authenticated as admin
    // 2. Feature flag allows it
    // 3. No token provided (admin creates without QR)
    const isAdminMode = isAdmin && allowAdminCreation && !req.body.token;
    
    console.log(`🔐 Authentication check: ${isAdminMode ? 'Admin mode' : 'Customer mode'}`);
    
    // Validate base schema first
    const validated = baseActivateSchema.safeParse(req.body);

    if (!validated.success) {
      console.warn("❌ Validation failed:", validated.error.errors);
      return res.status(400).json({
        error: "Invalid data",
        details: validated.error.errors,
      });
    }

    const data = validated.data;
    
    // CONDITIONAL VALIDATION: Require token for non-admin users
    if (!isAdminMode && !req.body.token) {
      console.warn("❌ Token required for customer activation");
      return res.status(400).json({
        error: "Invalid data",
        details: [{
          code: "invalid_type",
          expected: "string",
          received: "undefined",
          path: ["token"],
          message: "Token is required for customer activation"
        }]
      });
    }

    // STEP 1: Validate required fields
    if (!data.fullName || !data.email) {
      return res.status(400).json({
        error: "Full name and email are required"
      });
    }

    console.log("✅ Setup activation data validated:", {
      fullName: data.fullName,
      email: data.email,
      zip: data.zip,
      isAdminMode
    });

    // STEP 2: Create household record
    const household = await storage.createHousehold({
      name: data.fullName,
      email: data.email,
      phone: data.phone || null,
      zipcode: data.zip || null,
      setupStatus: 'in_progress',
      magnetToken: isAdminMode ? null : req.body.token,
      createdBy: isAdminMode ? 'admin' : 'customer',
      createdByUserId: isAdminMode ? authUser.id : null,
    });

    console.log("🎉 Household created successfully:", {
      id: household.id,
      email: household.email,
      setupStatus: household.setupStatus,
      createdBy: household.createdBy
    });

    // TODO: Send welcome email if not skipped and not admin mode
    // TODO: Generate maintenance schedules
    // TODO: Mark QR code token as used (for customer mode)

    // Return success response
    res.json({
      success: true,
      household: {
        id: household.id,
        email: household.email,
        status: household.setupStatus,
        createdBy: household.createdBy,
        createdAt: household.createdAt,
      }
    });

  } catch (error: unknown) {
    console.error("❌ Setup activation error:", error);
    res.status(500).json({
      error: "Failed to activate setup",
    });
  }
});

export default router;
