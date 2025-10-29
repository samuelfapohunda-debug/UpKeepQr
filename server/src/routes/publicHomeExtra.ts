import { homeExtraLimiter } from "../middleware/rateLimit.js";
import { Router } from "express";
import type { Request, Response } from "express";
import { updateHomeProfileExtraSchema } from "../../validators/homeProfileExtra.js";
import { 
  getHomeProfileExtraByHomeId, 
  updateHomeProfileExtraByHomeId,
  getHomeIdByToken
} from "../../storage.js";

const router = Router();

// Public route - get home extra data by setup token
router.get("/setup/:token/extra", homeExtraLimiter, async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    const homeId = await getHomeIdByToken(token);
    if (!homeId) {
      return res.status(404).json({ error: "Home not found" });
    }
    
    const extra = await getHomeProfileExtraByHomeId(homeId);
    res.json({ success: true, data: extra });
  } catch (error) {
    console.error("Error fetching home extra:", error);
    res.status(500).json({ error: "Failed to fetch home profile data" });
  }
});

// Public route - update home extra data by setup token
router.patch("/setup/:token/extra", homeExtraLimiter, async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    const homeId = await getHomeIdByToken(token);
    if (!homeId) {
      return res.status(404).json({ error: "Home not found" });
    }
    
    const validatedData = updateHomeProfileExtraSchema.parse(req.body);
    const updated = await updateHomeProfileExtraByHomeId(homeId, validatedData);
    
    // Emit analytics events
    console.log("📊 Analytics: home_extra_saved", {
      homeId,
      fieldsProvided: Object.keys(validatedData),
      hasMarketingConsent: updated.marketingConsent
    });
    
    if (validatedData.sellWindow && validatedData.sellWindow !== 'none') {
      console.log("📊 Analytics: intent_sell_window_selected", { 
        homeId, 
        sellWindow: validatedData.sellWindow 
      });
    }
    
    if (validatedData.plannedProjects && validatedData.plannedProjects.length > 0) {
      validatedData.plannedProjects.forEach(project => {
        console.log("📊 Analytics: intent_project_selected", { homeId, project });
      });
    }
    
    if (typeof validatedData.marketingConsent !== 'undefined') {
      console.log("📊 Analytics: consent_marketing_toggled", { 
        homeId, 
        marketingConsent: validatedData.marketingConsent 
      });
    }
    
    res.json({ 
      success: true, 
      data: updated,
      message: "Home profile updated successfully" 
    });
  } catch (error: any) {
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
