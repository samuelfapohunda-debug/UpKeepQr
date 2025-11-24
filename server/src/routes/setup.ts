import { Router, Request, Response } from "express";
import { z } from "zod";
import { getUserFromAuth } from "../../middleware/auth";
import { storage } from "../../storage";
import { nanoid } from "nanoid";
import { db } from "../../db";
import { householdsTable, orderMagnetItemsTable, homeProfileExtras } from "@shared/schema";
import { eq } from "drizzle-orm";

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
    console.log("📥 Received setup activation request");
    console.log("🔑 Authorization header:", req.headers.authorization ? "Present" : "Missing");
    
    // Check if user is authenticated as admin
    const authUser = await getUserFromAuth(req);
    console.log("👤 Authenticated user:", authUser ? `${authUser.email} (${authUser.role})` : "None");
    
    const isAdmin = authUser && authUser.role === 'admin';
    const allowAdminCreation = process.env.ALLOW_ADMIN_SETUP_CREATION === 'true';
    const hasToken = !!req.body.token;
    
    // Admin mode is only enabled if:
    // 1. User is authenticated as admin
    // 2. Feature flag allows it
    // 3. No token provided (admin creates without QR)
    const isAdminMode = isAdmin && allowAdminCreation && !hasToken;
    
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

    // Validate required fields
    if (!data.fullName || !data.email) {
      return res.status(400).json({
        error: "Full name and email are required"
      });
    }

    console.log("✅ Setup activation data validated:", {
      fullName: data.fullName,
      email: data.email,
      isAdminMode
    });

    // PHASE 1: COMPLETE SETUP WITH TRANSACTION
    const result = await db.transaction(async (tx) => {
      const magnetToken = req.body.token;
      let orderId: string | null = null;

      // STEP 1: DUPLICATE CHECK (for customer mode with token)
      if (!isAdminMode && magnetToken) {
        console.log("🔍 Checking for duplicate activation token:", magnetToken);
        
        const [existingHousehold] = await tx
          .select()
          .from(householdsTable)
          .where(eq(householdsTable.magnetToken, magnetToken))
          .limit(1);

        if (existingHousehold) {
          console.warn("⚠️ Activation code already used:", magnetToken);
          throw new Error(`DUPLICATE_TOKEN:${existingHousehold.id}`);
        }
      }

      // STEP 2: LINK TO ORDER (for customer mode with token)
      if (!isAdminMode && magnetToken) {
        console.log("🔗 Looking up order from activation code:", magnetToken);
        
        const [magnetItem] = await tx
          .select()
          .from(orderMagnetItemsTable)
          .where(eq(orderMagnetItemsTable.activationCode, magnetToken))
          .limit(1);

        if (magnetItem) {
          orderId = magnetItem.orderId;
          console.log("✅ Found linked order:", orderId);
        } else {
          console.warn("⚠️ No order found for activation code:", magnetToken);
        }
      }

      // STEP 3: CREATE HOUSEHOLD WITH COMPLETE STATUS
      const now = new Date();
      const householdId = nanoid();
      
      const [household] = await tx
        .insert(householdsTable)
        .values({
          id: householdId,
          name: data.fullName,
          email: data.email,
          phone: data.phone || null,
          addressLine1: req.body.streetAddress || null,
          city: req.body.city || null,
          state: req.body.state || null,
          zipcode: req.body.postalCode || req.body.zip || null,
          notificationPreference: data.preferredContact === 'email' ? 'email_only' 
            : data.preferredContact === 'text' ? 'sms_only' 
            : 'both',
          smsOptIn: data.smsOptIn || false,
          preferredContact: data.preferredContact || null,
          setupStatus: 'completed', // Mark as completed
          setupStartedAt: now,
          setupCompletedAt: now, // Set completion timestamp
          magnetToken: isAdminMode ? null : magnetToken,
          orderId: orderId, // Link to order
          createdBy: isAdminMode ? 'admin' : 'customer',
          createdByUserId: isAdminMode ? authUser?.id : null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      console.log("✅ Household created with completed status:", {
        id: household.id,
        setupStatus: household.setupStatus,
        orderId: household.orderId
      });

      // STEP 4: SAVE HOME PROFILE DATA (if any home details provided)
      const hasHomeData = req.body.homeType || req.body.yearBuilt || req.body.sqft || 
                         req.body.bedrooms || req.body.bathrooms || req.body.hvacType || 
                         req.body.waterHeater || req.body.roofAgeYears;

      if (hasHomeData) {
        console.log("🏠 Creating home profile data");
        
        await tx
          .insert(homeProfileExtras)
          .values({
            householdId: household.id,
            yearBuilt: req.body.yearBuilt || null,
            hvacType: req.body.hvacType || null,
            waterHeaterType: req.body.waterHeater || null,
            roofAgeYears: req.body.roofAgeYears || null,
            createdAt: now,
            updatedAt: now,
          });

        console.log("✅ Home profile data saved");
      }

      // STEP 5: UPDATE QR CODE STATUS (for customer mode with token)
      if (!isAdminMode && magnetToken) {
        console.log("🎫 Updating QR code activation status");
        
        const [updatedItem] = await tx
          .update(orderMagnetItemsTable)
          .set({
            activationStatus: 'active',
            activatedAt: now,
            activatedByEmail: data.email,
            updatedAt: now,
          })
          .where(eq(orderMagnetItemsTable.activationCode, magnetToken))
          .returning();

        if (updatedItem) {
          console.log("✅ QR code marked as active");
        } else {
          console.warn("⚠️ Could not update QR code status (item not found)");
        }
      }

      return household;
    });

    console.log("🎉 Setup activation completed successfully:", {
      householdId: result.id,
      setupStatus: result.setupStatus
    });

    // Return success response
    res.json({
      success: true,
      household: {
        id: result.id,
        email: result.email,
        status: result.setupStatus,
        createdBy: result.createdBy,
        createdAt: result.createdAt,
      }
    });

  } catch (error: unknown) {
    console.error("❌ Setup activation error:", error);
    
    // Handle duplicate token error
    if (error instanceof Error && error.message.startsWith('DUPLICATE_TOKEN:')) {
      const householdId = error.message.split(':')[1];
      return res.status(409).json({
        error: "Activation code already used",
        householdId: householdId
      });
    }
    
    // Generic error response
    res.status(500).json({
      error: "Failed to activate setup. Please try again.",
    });
  }
});

export default router;
