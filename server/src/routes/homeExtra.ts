import { homeExtraLimiter } from "../middleware/rateLimit.js";
import { Router } from "express";
import type { Request, Response } from "express";
import { updateHomeProfileExtraSchema } from "../../validators/homeProfileExtra.js";
import { 
  getHomeProfileExtra, 
  updateHomeProfileExtra,
} from "../../storage.js";
import { authenticateAdmin } from "../../middleware/auth.js";
import { adminDb } from "../../firebase.js";

const router = Router();

router.get("/home-extra/:householdId", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { householdId } = req.params;
    
    const householdDoc = await adminDb.collection("households").doc(householdId).get();
    if (!householdDoc.exists) {
      return res.status(404).json({ error: "Household not found" });
    }
    
    const extra = await getHomeProfileExtra(householdId);
    res.json({ success: true, data: extra });
  } catch (error) {
    console.error("Error fetching home extra:", error);
    res.status(500).json({ error: "Failed to fetch home profile data" });
  }
});

router.patch("/home-extra/:householdId", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { householdId } = req.params;
    
    const householdDoc = await adminDb.collection("households").doc(householdId).get();
    if (!householdDoc.exists) {
      return res.status(404).json({ error: "Household not found" });
    }
    
    const validatedData = updateHomeProfileExtraSchema.parse(req.body);
    const updated = await updateHomeProfileExtra(householdId, validatedData);
    
    res.json({ 
      success: true, 
      data: updated,
      message: "Home profile updated successfully" 
    });
  } catch (error: unknown) {
    console.error("Error updating home extra:", error);
    
    if (error.name === "ZodError") {
      return res.status(400).json({ 
        error: "Invalid data format",
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: "Failed to update home profile" });
  }
});

export default router;
