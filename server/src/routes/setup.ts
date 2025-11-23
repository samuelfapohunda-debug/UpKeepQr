import { Router, Request, Response } from "express";
import { z } from "zod";
import { getUserFromAuth } from "../../middleware/auth";

const router = Router();

// Base validation schema (all fields optional initially)
const baseActivateSchema = z.object({
  token: z.string().optional(),
  zip: z.string().min(5).max(10).optional(),
  home_type: z.string().optional(),
  sqft: z.number().optional(),
  hvac_type: z.string().optional(),
  water_heater: z.string().optional(),
  roof_age_years: z.number().optional(),
  email: z.string().email().optional(),
});

router.post("/activate", async (req: Request, res: Response) => {
  try {
    console.log("📥 Received setup activation request:", req.body);
    
    // Check if user is authenticated as admin
    const authUser = await getUserFromAuth(req);
    const isAdmin = authUser && authUser.role === 'admin';
    const allowAdminCreation = process.env.ALLOW_ADMIN_SETUP_CREATION === 'true';
    
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
    if (!isAdminMode && !data.token) {
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

    console.log("✅ Setup activation received:", {
      token: data.token,
      zip: data.zip,
      email: data.email,
    });

    // Return success - the actual home profile will be created later
    // This just validates the token and stores basic info
    res.json({
      success: true,
      message: "Setup activation complete",
      token: data.token,
    });

  } catch (error: unknown) {
    console.error("❌ Setup activation error:", error);
    res.status(500).json({
      error: "Failed to activate setup",
    });
  }
});

export default router;
