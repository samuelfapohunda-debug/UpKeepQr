import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateAdmin } from "./middleware/auth";
import { insertBatchSchema, setupActivateSchema, setupPreviewSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import fs from "fs";
import { getClimateZone, generateCoreSchedule, buildInitialSchedule, type Household as ClimateHousehold } from "./lib/climate";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Routes - Public

  // POST /api/setup/activate - Activate household setup
  app.post("/api/setup/activate", async (req, res) => {
    try {
      const validatedData = setupActivateSchema.parse(req.body);
      const { token, zip, home_type, sqft, hvac_type, water_heater, roof_age_years, email } = validatedData;

      // Validate token exists in magnets
      const magnet = await storage.getMagnetByToken(token);
      if (!magnet) {
        return res.status(404).json({ error: "Invalid or expired token" });
      }

      // Check if household already exists (upsert behavior)
      let household = await storage.getHouseholdByToken(token);
      
      if (household) {
        // Update existing household
        household = await storage.updateHousehold(household.id, {
          zip,
          homeType: home_type,
          sqft,
          hvacType: hvac_type,
          waterHeater: water_heater,
          roofAgeYears: roof_age_years,
          email,
          activatedAt: new Date(),
        });
      } else {
        // Create new household
        household = await storage.createHousehold({
          token,
          zip,
          homeType: home_type,
          sqft,
          hvacType: hvac_type,
          waterHeater: water_heater,
          roofAgeYears: roof_age_years,
          email,
          activatedAt: new Date(),
        });
      }

      if (!household) {
        return res.status(500).json({ error: "Failed to create/update household" });
      }

      // Get climate zone and generate schedule
      const climateZone = getClimateZone(zip);
      const coreTasks = generateCoreSchedule(climateZone);

      // Build initial schedule with proper due dates
      const climateHousehold: ClimateHousehold = {
        id: household.id,
        zip: household.zip,
        homeType: household.homeType,
        climateZone,
      };
      const scheduledTasks = buildInitialSchedule(climateHousehold, coreTasks);

      // Create schedules for core tasks with calculated due dates
      const schedules = [];
      for (const scheduled of scheduledTasks) {
        const schedule = await storage.createSchedule({
          householdId: household.id,
          taskName: scheduled.task.name,
          description: scheduled.task.description,
          frequencyMonths: scheduled.task.frequencyMonths,
          climateZone,
          priority: scheduled.task.priority,
        });
        schedules.push(schedule);

        // Queue email reminder 7 days before due date
        const reminderDate = new Date(scheduled.next_due_date);
        reminderDate.setDate(reminderDate.getDate() - 7);
        
        await storage.createReminder({
          householdId: household.id,
          taskName: scheduled.task.name,
          dueDate: reminderDate,
        });
      }

      // Record activation event
      await storage.createEvent({
        householdId: household.id,
        eventType: 'activated',
        eventData: JSON.stringify({ 
          zip, 
          home_type, 
          climate_zone: climateZone,
          tasks_created: schedules.length 
        }),
      });

      res.json({
        success: true,
        household: {
          id: household.id,
          zip: household.zip,
          homeType: household.homeType,
          climateZone,
        },
        schedules: schedules.map(s => ({
          taskName: s.taskName,
          description: s.description,
          frequencyMonths: s.frequencyMonths,
          priority: s.priority,
        })),
        firstTaskDue: scheduledTasks.length > 0 
          ? scheduledTasks.sort((a, b) => a.next_due_date.getTime() - b.next_due_date.getTime())[0].next_due_date.toISOString()
          : new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error activating setup:", error);
      if (error?.name === 'ZodError') {
        res.status(400).json({ error: "Invalid input data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to activate setup" });
      }
    }
  });

  // POST /api/setup/preview - Preview tasks without persistence
  app.post("/api/setup/preview", async (req, res) => {
    try {
      const validatedData = setupPreviewSchema.parse(req.body);
      const { zip, home_type } = validatedData;

      // Get climate zone and generate schedule
      const climateZone = getClimateZone(zip);
      const coreTasks = generateCoreSchedule(climateZone);

      // Build initial schedule with proper due dates (no persistence)
      const previewHousehold: ClimateHousehold = {
        id: 'preview',
        zip,
        homeType: home_type,
        climateZone,
      };
      const scheduledTasks = buildInitialSchedule(previewHousehold, coreTasks);

      // Return the first 6 tasks with dates
      const taskPreviews = scheduledTasks
        .slice(0, 6)
        .sort((a, b) => a.task.priority - b.task.priority)
        .map(scheduled => ({
          taskName: scheduled.task.name,
          description: scheduled.task.description,
          frequencyMonths: scheduled.task.frequencyMonths,
          priority: scheduled.task.priority,
          nextDueDate: scheduled.next_due_date.toISOString(),
          taskCode: scheduled.task_code,
        }));

      res.json({
        success: true,
        climateZone,
        tasks: taskPreviews,
        totalTasks: coreTasks.length,
      });
    } catch (error: any) {
      console.error("Error generating preview:", error);
      if (error?.name === 'ZodError') {
        res.status(400).json({ error: "Invalid input data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to generate preview" });
      }
    }
  });

  // Admin Routes - Protected with JWT
  
  // POST /api/admin/batches - Create a magnet batch
  app.post("/api/admin/batches", authenticateAdmin, async (req, res) => {
    try {
      const validatedData = insertBatchSchema.parse(req.body);
      const { agentId, qty } = validatedData;

      if (qty <= 0 || qty > 1000) {
        return res.status(400).json({ error: "Quantity must be between 1 and 1000" });
      }

      // Create the batch
      const batch = await storage.createBatch({ agentId, qty });
      
      // Generate magnets for the batch
      const magnets = [];
      const publicBaseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:5000";
      
      for (let i = 0; i < qty; i++) {
        const token = nanoid();
        const url = `${publicBaseUrl}/setup/${token}`;
        
        const magnet = await storage.createMagnet({
          batchId: batch.id,
          token,
          url,
        });
        
        magnets.push(magnet);
      }

      res.json({
        success: true,
        batch,
        magnets: magnets.length,
      });
    } catch (error) {
      console.error("Error creating batch:", error);
      res.status(500).json({ error: "Failed to create batch" });
    }
  });

  // GET /api/admin/batches/:id/csv - Export batch as CSV
  app.get("/api/admin/batches/:id/csv", authenticateAdmin, async (req, res) => {
    try {
      const batchId = req.params.id;
      const magnets = await storage.getMagnetsByBatchId(batchId);
      
      if (!magnets || magnets.length === 0) {
        return res.status(404).json({ error: "Batch not found or has no magnets" });
      }

      // Create CSV content
      const csvData = magnets.map(magnet => ({
        token: magnet.token,
        url: magnet.url,
      }));

      // Create temporary CSV file
      const tempDir = "/tmp";
      const csvFilePath = path.join(tempDir, `batch-${batchId}-${Date.now()}.csv`);
      
      const csvWriter = createObjectCsvWriter({
        path: csvFilePath,
        header: [
          { id: 'token', title: 'TOKEN' },
          { id: 'url', title: 'URL' },
        ],
      });

      await csvWriter.writeRecords(csvData);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="batch-${batchId}.csv"`);
      
      // Stream the file and clean up
      const fileStream = fs.createReadStream(csvFilePath);
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        fs.unlinkSync(csvFilePath); // Clean up temp file
      });
      
    } catch (error) {
      console.error("Error exporting CSV:", error);
      res.status(500).json({ error: "Failed to export CSV" });
    }
  });

  // GET /api/admin/magnets/:id/qr.png - Generate QR code PNG
  app.get("/api/admin/magnets/:id/qr.png", authenticateAdmin, async (req, res) => {
    try {
      const magnetId = req.params.id;
      const magnet = await storage.getMagnetById(magnetId);
      
      if (!magnet) {
        return res.status(404).json({ error: "Magnet not found" });
      }

      // Generate QR code as PNG buffer
      const qrBuffer = await QRCode.toBuffer(magnet.url, {
        type: 'png',
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="magnet-${magnetId}.png"`);
      res.send(qrBuffer);
      
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
