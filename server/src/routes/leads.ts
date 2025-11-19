import { Router, Request, Response } from "express";
import { nanoid } from "nanoid";
import { db } from "../../db.js";
import { leadsTable } from "@shared/schema";
import { z } from "zod";
import rateLimit from "express-rate-limit";

const router = Router();

// Rate limiting: 5 requests per 15 minutes per IP
const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many submissions. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: false, // Disable strict proxy validation for Replit environment
});

// Validation schema
const leadSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20),
  preferredContact: z.enum(["Email", "Phone", "SMS"]).optional(),
  hearAboutUs: z.string().max(50).optional(),
  streetAddress: z.string().min(5, "Address is required").max(255),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().length(2, "State must be 2 characters"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  propertyType: z.string().max(50).optional(),
  homeType: z.string().max(50).optional(),
  interestType: z.enum(["Sales", "Rent", "Lease"]).optional(),
  needConsultation: z.boolean().optional(),
  isOwner: z.boolean().optional(),
  budgetRange: z.string().max(20).optional(),
  timelineToProceed: z.string().max(50).optional(),
  preferredContactTime: z.string().max(20).optional(),
  notes: z.string().max(1000).optional(),
  activationCode: z.string().min(1),
});

router.post("/", leadLimiter, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validated = leadSchema.safeParse(req.body);

    if (!validated.success) {
      console.warn("❌ Validation failed:", validated.error.errors);
      return res.status(400).json({
        error: "Invalid form data",
        details: validated.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    const leadData = validated.data;
    const leadId = nanoid(16);

    // Insert into database
    await db.insert(leadsTable).values({
      id: leadId,
      fullName: leadData.fullName,
      email: leadData.email.toLowerCase(),
      phone: leadData.phone,
      preferredContact: leadData.preferredContact,
      hearAboutUs: leadData.hearAboutUs,
      streetAddress: leadData.streetAddress,
      city: leadData.city,
      state: leadData.state.toUpperCase(),
      zipCode: leadData.zipCode,
      propertyType: leadData.propertyType,
      homeType: leadData.homeType,
      interestType: leadData.interestType,
      needConsultation: leadData.needConsultation,
      isOwner: leadData.isOwner,
      budgetRange: leadData.budgetRange,
      timelineToProceed: leadData.timelineToProceed,
      preferredContactTime: leadData.preferredContactTime,
      notes: leadData.notes,
      activationCode: leadData.activationCode,
    });

    console.log("✅ Lead captured successfully:", {
      id: leadId,
      email: leadData.email,
      activationCode: leadData.activationCode,
    });

    res.status(201).json({ 
      success: true, 
      leadId,
      message: "Lead information saved successfully" 
    });

  } catch (error) {
    console.error("❌ Lead capture error:", error);
    
    // Don't expose internal errors to client
    res.status(500).json({ 
      error: "Failed to save lead information. Please try again." 
    });
  }
});

export default router;
