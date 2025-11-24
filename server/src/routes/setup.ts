import { Router, Request, Response } from "express";
import { z } from "zod";
import { getUserFromAuth } from "../../middleware/auth";
import { storage } from "../../storage";
import { nanoid } from "nanoid";
import { db } from "../../db";
import { householdsTable, orderMagnetItemsTable, homeProfileExtras, setupActivateSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { 
  sendSetupConfirmationEmail,
  sendAdminSetupNotification
} from '../../lib/email.js';
import { generateMaintenanceTasks } from '../../lib/tasks.js';

const router = Router();

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
    
    // Validate using comprehensive setupActivateSchema
    const validated = setupActivateSchema.safeParse(req.body);

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

    console.log("✅ Setup activation data validated:", {
      fullName: data.fullName,
      email: data.email,
      isAdminMode
    });

    // PHASE 1: COMPLETE SETUP WITH TRANSACTION
    const result = await db.transaction(async (tx) => {
      const magnetToken = data.token;
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

      // STEP 2: VALIDATE TOKEN AND LINK TO ORDER (for customer mode with token)
      if (!isAdminMode && magnetToken) {
        console.log("🔗 Validating activation code and looking up order:", magnetToken);
        
        const [magnetItem] = await tx
          .select()
          .from(orderMagnetItemsTable)
          .where(eq(orderMagnetItemsTable.activationCode, magnetToken))
          .limit(1);

        if (!magnetItem) {
          console.warn("⚠️ Invalid activation code:", magnetToken);
          throw new Error('INVALID_TOKEN');
        }

        // Check if already activated
        if (magnetItem.activationStatus === 'active') {
          console.warn("⚠️ Activation code already active:", magnetToken);
          throw new Error('ALREADY_ACTIVATED');
        }

        orderId = magnetItem.orderId;
        console.log("✅ Found linked order:", orderId);
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
          addressLine1: data.streetAddress || null,
          city: data.city || null,
          state: data.state || null,
          zipcode: data.postalCode || data.zip || null,
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

      // STEP 4: SAVE COMPREHENSIVE HOME PROFILE DATA
      // Always create home_profile_extras record (establishing relationship)
      console.log("🏠 Creating comprehensive home profile data");
      
      await tx
        .insert(homeProfileExtras)
        .values({
          householdId: household.id,
          
          // Property Details (Phase 1 core fields)
          homeType: data.homeType || null,
          yearBuilt: data.yearBuilt || null,
          squareFootage: data.sqft || null,
          bedrooms: data.bedrooms || null,
          bathrooms: data.bathrooms || null,
          
          // Roof
          roofAgeYears: data.roofAgeYears || null,
          
          // HVAC & Systems  
          hvacType: data.hvacType || null,
          waterHeaterType: data.waterHeater || null,
          
          // Ownership type (convert boolean isOwner to enum)
          ownerType: data.isOwner === true ? 'owner' : null,
          
          // Budget preferences (map budgetRange to budgetBand)
          budgetBand: data.budgetRange || null,
          
          // Contact preferences
          contactPrefChannel: data.preferredContact || null,
          
          // Timestamps
          createdAt: now,
          updatedAt: now,
        });

      console.log("✅ Home profile data saved with all Phase 1 fields");

      // STEP 4.5: GENERATE MAINTENANCE TASKS (non-critical, wrapped in try-catch)
      console.log("🔧 Generating maintenance tasks...");
      try {
        const homeProfileData = {
          homeType: data.homeType || undefined,
          hvacType: data.hvacType || undefined,
          waterHeaterType: data.waterHeater || undefined,
          roofAgeYears: data.roofAgeYears || undefined,
          squareFootage: data.sqft || undefined
        };
        
        const tasks = await generateMaintenanceTasks(tx, household.id, homeProfileData);
        console.log(`✅ Generated ${tasks.length} maintenance tasks`);
      } catch (taskError) {
        console.error('⚠️ Task generation failed (non-critical):', taskError);
        // Don't fail the setup if task generation fails
        // Tasks can be generated manually later
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
        }
      }

      return household;
    });

    console.log("🎉 Setup activation completed successfully:", {
      householdId: result.id,
      setupStatus: result.setupStatus
    });

    // Query home profile data for emails (non-blocking)
    const homeProfile = await db
      .select()
      .from(homeProfileExtras)
      .where(eq(homeProfileExtras.householdId, result.id))
      .limit(1)
      .then(rows => rows[0] || null)
      .catch(err => {
        console.error('❌ Failed to fetch home profile for emails:', err);
        return null;
      });

    // Send emails (fire-and-forget - don't wait for completion)
    void Promise.all([
      // Customer confirmation email
      sendSetupConfirmationEmail(
        result.email,
        result.name,
        result.id,
        {
          address: result.addressLine1 
            ? `${result.addressLine1}${result.city ? ', ' + result.city : ''}${result.state ? ', ' + result.state : ''}`
            : 'Your home',
          homeType: homeProfile?.homeType || undefined,
          sqft: homeProfile?.squareFootage || undefined
        }
      ).catch(err => {
        console.error('❌ Failed to send setup confirmation email:', err);
      }),
      
      // Admin notification email
      sendAdminSetupNotification(
        result.name,
        result.email,
        result.id,
        result.orderId,
        {
          address: result.addressLine1 || 'Not provided',
          city: result.city || undefined,
          state: result.state || undefined,
          zip: result.zipcode || undefined,
          homeType: homeProfile?.homeType || undefined,
          sqft: homeProfile?.squareFootage || undefined,
          hvacType: homeProfile?.hvacType || undefined,
          waterHeaterType: homeProfile?.waterHeaterType || undefined
        }
      ).catch(err => {
        console.error('❌ Failed to send admin notification email:', err);
      })
    ]);

    // Return success response immediately (don't wait for emails)
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
    
    // Handle already activated token error
    if (error instanceof Error && error.message === 'ALREADY_ACTIVATED') {
      return res.status(409).json({
        error: "This QR code has already been activated. Each code can only be used once.",
      });
    }
    
    // Handle invalid token error
    if (error instanceof Error && error.message === 'INVALID_TOKEN') {
      return res.status(404).json({
        error: "Invalid activation code. Please check your QR code and try again.",
      });
    }
    
    // Generic error response
    res.status(500).json({
      error: "Failed to activate setup. Please try again.",
    });
  }
});

export default router;
