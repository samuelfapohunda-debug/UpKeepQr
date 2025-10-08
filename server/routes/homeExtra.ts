import express from "express";
import { homeProfileExtraSchema } from "../models/homeProfileExtra";
import { homeProfileExtraStorage } from "../storage/homeProfileExtra";

const router = express.Router();

router.get("/api/home/:homeId/extra", async (req, res) => {
  try {
    const { homeId } = req.params;
    const data = await homeProfileExtraStorage.get(parseInt(homeId));
    res.json({ success: true, data: data || {} });
  } catch (err) {
    console.error("Error fetching home extra:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

router.patch("/api/home/:homeId/extra", async (req, res) => {
  try {
    const { homeId } = req.params;
    const validatedData = homeProfileExtraSchema.parse(req.body);
    const updated = await homeProfileExtraStorage.upsert(parseInt(homeId), validatedData);
    res.json({ success: true, data: updated, message: "Profile updated successfully" });
  } catch (err: any) {
    console.error("Error updating home extra:", err);
    if (err.name === "ZodError") {
      return res.status(400).json({ error: "Validation failed", details: err.errors });
    }
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
