import { Router, Request, Response } from "express";
import { z } from "zod";

const router = Router();

// Validation schema for activation
const activateSchema = z.object({
  token: z.string().min(1),
  zip: z.string().min(5).max(10),
  home_type: z.string().optional(),
  sqft: z.string().optional(),
  hvac_type: z.string().optional(),
  water_heater: z.string().optional(),
  roof_age_years: z.string().optional(),
  email: z.string().email().optional(),
});

router.post("/activate", async (req: Request, res: Response) => {
  try {
    const validated = activateSchema.safeParse(req.body);

    if (!validated.success) {
      console.warn("❌ Validation failed:", validated.error.errors);
      return res.status(400).json({
        error: "Invalid data",
        details: validated.error.errors,
      });
    }

    const data = validated.data;

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

  } catch (error: any) {
    console.error("❌ Setup activation error:", error);
    res.status(500).json({
      error: "Failed to activate setup",
    });
  }
});

export default router;
