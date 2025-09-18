import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateAdmin, authenticateAgent, authenticateProAdmin } from "./middleware/auth";
import { sendUserConfirmationEmail, sendAdminAlertEmail, sendStatusUpdateEmail } from "./lib/email";
import { insertMagnetBatchSchema, insertBatchSchema, setupActivateSchema, setupPreviewSchema, taskCompleteSchema, agentLoginSchema, checkoutSchema, leadsSchema, smsOptInSchema, smsVerifySchema, createProRequestSchema, updateProRequestStatusSchema, adminProRequestFiltersSchema, createNoteSchema } from "../shared/schema";
import { nanoid } from "nanoid";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import fs from "fs";
import { getClimateZone, generateCoreSchedule, buildInitialSchedule, type Household as ClimateHousehold } from "./lib/climate";
import { sendWelcomeEmail, sendOrderConfirmationEmail, sendContactFormEmails } from "./lib/mail";
import jwt from "jsonwebtoken";
import { createRequire } from 'module';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

// Initialize Stripe - temporarily commented out to debug import issue
// const require = createRequire(import.meta.url);
// const Stripe = require('stripe');
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2024-06-20',
// });

// Temporary placeholder for Stripe - will fix the import issue
const stripe = {
  checkout: {
    sessions: {
      create: async (params: any) => {
        // Extract the success URL from params and return it directly for testing
        const successUrl = params.success_url || 'http://localhost:5000/setup/success';
        return { 
          id: 'temp_session_id', 
          url: successUrl.replace('{CHECKOUT_SESSION_ID}', 'temp_session_id')
        };
      }
    }
  },
  webhooks: {
    constructEvent: (body: any, sig: any, secret: any) => ({ type: 'test', data: { object: {} } })
  }
};

// Rate limiters
const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit login attempts
  message: { error: "Too many login attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const smsApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Limit SMS requests
  message: { error: "Too many SMS requests, please try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

const proRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit pro request submissions to 10 per IP per 10 minutes
  message: { error: "Too many pro requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Audit logging helper
async function createAuditLog(req: any, action: string) {
  try {
    const actor = req.ip || 'unknown';
    const meta = {
      method: req.method,
      url: req.url,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    };
    await storage.createAuditLog({ actor, action: `${req.method} ${action}`, meta });
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

// Generic error handler
function handleError(error: any, action: string, res: any) {
  console.error(`Error in ${action}:`, {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString()
  });

  if (error?.name === 'ZodError') {
    return res.status(400).json({ 
      error: "Invalid input data",
      fields: error.errors?.map((e: any) => e.path[0]).filter(Boolean) || []
    });
  }

  return res.status(500).json({ 
    error: "An error occurred processing your request" 
  });
}

// SKU pricing configuration
const SKU_CONFIG = {
  single: { 
    name: "Single Pack", 
    price: 1900, // $19.00 in cents
    description: "1 QR Magnet for homeowners",
    quantity: 1
  },
  twopack: { 
    name: "Two Pack", 
    price: 3500, // $35.00 in cents
    description: "2 QR Magnets - great for sharing",
    quantity: 2
  },
  "100pack": { 
    name: "Agent 100-Pack", 
    price: 89900, // $899.00 in cents
    description: "100 QR Magnets for real estate agents",
    quantity: 100,
    isAgentPack: true
  },
  "500pack": { 
    name: "Agent 500-Pack", 
    price: 399900, // $3999.00 in cents
    description: "500 QR Magnets for enterprise agents",
    quantity: 500,
    isAgentPack: true
  },
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Add morgan logging for all requests
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => console.log(message.trim())
    }
  }));
  // Setup Routes - Public

  // POST /api/setup/activate - Activate household setup
  app.post("/api/setup/activate", publicApiLimiter, async (req, res) => {
    await createAuditLog(req, '/api/setup/activate');
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
          homeType: home_type as any,
          activatedAt: new Date(),
        });
      } else {
        // Create new household
        household = await storage.createHousehold({
          id: uuidv4(),
          magnetToken: token,
          agentId: magnet.agentId,
          name: email?.split('@')[0] || 'User',
          email: email || '',
          address: '',
          city: '',
          state: '',
          zip,
          homeType: home_type as any,
          smsOptIn: false,
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
        
        await storage.createReminderQueue({
          householdId: household.id,
          scheduleId: schedule.id,
          taskName: scheduled.task.name,
          taskDescription: scheduled.task.description,
          dueDate: scheduled.next_due_date,
          runAt: reminderDate,
          reminderType: 'email',
          message: `Reminder: ${scheduled.task.name} is due in 7 days`,
        });
      }

      // Send welcome email if email provided
      if (household.email) {
        try {
          const dashboardUrl = process.env.PUBLIC_BASE_URL 
            ? `${process.env.PUBLIC_BASE_URL}/admin`
            : "http://localhost:5000/admin";
            
          await sendWelcomeEmail({
            email: household.email,
            homeType: household.homeType,
            climateZone,
            taskCount: schedules.length,
            dashboardUrl,
          });
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
          // Don't fail the activation if email fails
        }
      }

      // Record activation event
      await storage.createEvent({
        householdId: household.id,
        eventType: 'activated',
        eventData: JSON.stringify({ 
          zip, 
          home_type, 
          climate_zone: climateZone,
          tasks_created: schedules.length,
          welcome_email_sent: !!household.email
        }),
      });

      res.json({
        success: true,
        household: {
          id: household.id,
          token: household.magnetToken,
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
      return handleError(error, 'setup/activate', res);
    }
  });

  // POST /api/setup/preview - Preview tasks without persistence
  app.post("/api/setup/preview", publicApiLimiter, async (req, res) => {
    await createAuditLog(req, '/api/setup/preview');
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
      return handleError(error, 'setup/preview', res);
    }
  });

  // POST /api/tasks/complete - Mark task as completed and schedule next occurrence
  app.post("/api/tasks/complete", async (req, res) => {
    try {
      const validatedData = taskCompleteSchema.parse(req.body);
      const { householdToken, task_code } = validatedData;

      // Get household by token
      const household = await storage.getHouseholdByToken(householdToken);
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }

      // Find the schedule for this task
      const schedule = await storage.getScheduleByHouseholdAndTask(household.id, task_code);
      if (!schedule) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Calculate next due date based on frequency
      const now = new Date();
      const nextDueDate = new Date(now);
      nextDueDate.setMonth(nextDueDate.getMonth() + schedule.frequencyMonths);

      // Record task completion
      await storage.createTaskCompletion({
        householdId: household.id,
        scheduleId: schedule.id,
        taskCode: task_code,
        completedAt: now,
        nextDueDate,
      });

      // Queue next reminder (7 days before next due date)
      const nextReminderDate = new Date(nextDueDate);
      nextReminderDate.setDate(nextReminderDate.getDate() - 7);

      await storage.createReminderQueue({
        householdId: household.id,
        scheduleId: schedule.id,
        taskName: schedule.taskName,
        taskDescription: schedule.description || undefined,
        dueDate: nextDueDate,
        runAt: nextReminderDate,
        reminderType: 'email',
        message: `Reminder: ${schedule.taskName} is due in 7 days`,
      });

      // Create completion event
      await storage.createEvent({
        householdId: household.id,
        eventType: 'task_completed',
        eventData: JSON.stringify({
          taskCode: task_code,
          taskName: schedule.taskName,
          completedAt: now.toISOString(),
          nextDueDate: nextDueDate.toISOString(),
        }),
      });

      res.json({
        success: true,
        message: `Task "${schedule.taskName}" marked as completed`,
        nextDueDate: nextDueDate.toISOString(),
        reminderScheduled: nextReminderDate.toISOString(),
      });
    } catch (error: any) {
      console.error("Error completing task:", error);
      if (error?.name === 'ZodError') {
        res.status(400).json({ error: "Invalid input data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to complete task" });
      }
    }
  });

  // POST /api/checkout - Create Stripe checkout session
  app.post("/api/checkout", async (req, res) => {
    try {
      const validatedData = checkoutSchema.parse(req.body);
      const { sku, agentId } = validatedData;

      const skuConfig = SKU_CONFIG[sku as keyof typeof SKU_CONFIG];
      if (!skuConfig) {
        return res.status(400).json({ error: "Invalid SKU" });
      }

      // Get base URL for redirect URLs
      const baseUrl = req.headers.origin || `${req.protocol}://${req.get('host')}` || 'http://localhost:5000';
      console.log('Base URL for checkout:', baseUrl);

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: skuConfig.name,
                description: skuConfig.description,
              },
              unit_amount: skuConfig.price,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/setup/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/?canceled=true`,
        metadata: {
          sku,
          agentId: agentId || '',
          quantity: skuConfig.quantity.toString(),
          isAgentPack: (skuConfig as any).isAgentPack ? 'true' : 'false',
        },
      });

      res.json({ 
        sessionId: session.id,
        checkoutUrl: session.url 
      });
    } catch (error: any) {
      console.error("Checkout error:", error);
      if (error?.name === 'ZodError') {
        res.status(400).json({ error: "Invalid checkout data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create checkout session" });
      }
    }
  });

  // POST /api/stripe/webhook - Stripe webhook handler
  // Test webhook endpoint (bypasses verification for testing)
  app.post("/api/stripe/webhook-test", express.json(), async (req, res) => {
    console.log("Test webhook received:", JSON.stringify(req.body, null, 2));
    
    const event = req.body;
    
    // Process the event the same way as the real webhook
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { sku, agentId, quantity, isAgentPack } = session.metadata || {};

      console.log("Processing test payment:", { sku, agentId, quantity, isAgentPack });

      // For now, just simulate success for agent packs
      if (isAgentPack === 'true' && agentId && quantity) {
        // Create a simple CSV file for testing
        const csvFilePath = path.join(process.cwd(), 'exports', `batch-test.csv`);
        
        // Ensure exports directory exists
        const exportsDir = path.dirname(csvFilePath);
        if (!fs.existsSync(exportsDir)) {
          fs.mkdirSync(exportsDir, { recursive: true });
        }

        const csvWriter = createObjectCsvWriter({
          path: csvFilePath,
          header: [
            { id: 'token', title: 'Token' },
            { id: 'url', title: 'Setup URL' },
            { id: 'qr_code_url', title: 'QR Code URL' },
          ]
        });

        const csvData = [];
        for (let i = 0; i < parseInt(quantity); i++) {
          const token = nanoid(12);
          const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5000';
          csvData.push({
            token: token,
            url: `${baseUrl}/setup/${token}`,
            qr_code_url: `${baseUrl}/api/admin/qr/${token}`,
          });
        }

        await csvWriter.writeRecords(csvData);

        console.log(`Created test batch with ${quantity} magnets`);
        
        // Send order confirmation email
        if (session.customer_details?.email) {
          try {
            const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5000';
            const downloadUrl = `${baseUrl}/api/download/batch/test`;
            
            await sendOrderConfirmationEmail({
              email: session.customer_details.email,
              customerName: session.customer_details.name || undefined,
              orderId: session.id,
              amount: session.amount_total || 0,
              quantity: parseInt(quantity),
              agentId,
              downloadUrl,
            });
            console.log(`Order confirmation email sent to ${session.customer_details.email}`);
          } catch (emailError) {
            console.error("Error sending order confirmation email:", emailError);
          }
        }
        
        res.json({ 
          success: true, 
          batchId: 'test', 
          magnetsCreated: parseInt(quantity),
          csvPath: csvFilePath
        });
        return;
      }
    }

    res.json({ received: true });
  });

  app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return res.status(400).json({ error: "Missing webhook signature or secret" });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { sku, agentId, quantity, isAgentPack } = session.metadata || {};

      console.log("Processing successful payment:", { sku, agentId, quantity, isAgentPack });

      try {
        // Process agent pack purchases
        if (isAgentPack === 'true' && agentId && quantity) {
          const qty = parseInt(quantity);
          
          // Create batch record
          const batch = await storage.createBatch({
            agentId,
            qty
          });

          // Create individual magnets and CSV data
          const csvData = [];
          const baseUrl = process.env.PUBLIC_BASE_URL || `https://${req.get('host')}`;
          
          for (let i = 0; i < qty; i++) {
            const token = nanoid(12);
            const setupUrl = `${baseUrl}/setup/${token}`;
            
            // Create magnet record
            const magnet = await storage.createMagnet({
              id: uuidv4(),
              batchId: batch.id,
              agentId,
              token,
              setupUrl,
              isUsed: false
            });

            csvData.push({
              token: token,
              url: setupUrl,
              qr_code_url: `${baseUrl}/api/admin/qr/${token}`,
            });
          }

          // Generate CSV file
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const csvFilePath = path.join(process.cwd(), 'exports', `magnets-${agentId}-${timestamp}.csv`);
          
          // Ensure exports directory exists
          const exportsDir = path.dirname(csvFilePath);
          if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true });
          }

          const csvWriter = createObjectCsvWriter({
            path: csvFilePath,
            header: [
              { id: 'token', title: 'Token' },
              { id: 'url', title: 'Setup URL' },
              { id: 'qr_code_url', title: 'QR Code URL' },
            ]
          });

          await csvWriter.writeRecords(csvData);

          // Update batch with CSV path
          await storage.updateMagnetBatch(batch.id, { csvPath: csvFilePath });

          console.log(`Created batch ${batch.id} with ${qty} magnets`);
          
          // Send order confirmation email
          if (session.customer_details?.email) {
            try {
              const downloadUrl = `${baseUrl}/api/download/batch/${batch.id}`;
              
              await sendOrderConfirmationEmail({
                email: session.customer_details.email,
                customerName: session.customer_details.name || undefined,
                orderId: session.id,
                amount: session.amount_total || 0,
                quantity: qty,
                agentId,
                downloadUrl,
              });
              console.log(`Order confirmation email sent to ${session.customer_details.email}`);
            } catch (emailError) {
              console.error("Error sending order confirmation email:", emailError);
            }
          }

          // Create audit log
          await storage.createAuditLog({
            eventType: 'payment_completed',
            agentId,
            eventData: JSON.stringify({
              sessionId: session.id,
              batchId: batch.id,
              quantity: qty,
              amount: session.amount_total
            })
          });
        }
      } catch (error) {
        console.error("Error processing payment webhook:", error);
        // Don't return error to Stripe - we don't want them to retry
        // Just log the issue for manual investigation
      }
    }

    res.json({ received: true });
  });

  // POST /api/leads - Create lead for professional services
  app.post("/api/leads", publicApiLimiter, async (req, res) => {
    await createAuditLog(req, '/api/leads');
    try {
      const validatedData = leadsSchema.parse(req.body);
      const { householdToken, service, notes } = validatedData;

      // Get household by token
      const household = await storage.getHouseholdByToken(householdToken);
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }

      // Create the lead
      const lead = await storage.createLead({
        householdId: household.id,
        service,
        notes,
      });

      // Record lead created event
      await storage.createEvent({
        householdId: household.id,
        eventType: 'lead_created',
        eventData: JSON.stringify({
          leadId: lead.id,
          service,
          notes,
        }),
      });

      // Send email notifications
      try {
        const mailModule = await import('./lib/mail');
        const { sendLeadNotificationEmail } = mailModule;
        
        // Send to partner (example partner email)
        await sendLeadNotificationEmail(
          'partner@agenthub.com',
          'New Service Lead',
          {
            service,
            householdZip: household.zip,
            homeType: household.homeType,
            customerEmail: household.email || 'Not provided',
            notes: notes || 'No additional notes',
            leadId: lead.id,
          }
        );

        // Send to tracking email
        await sendLeadNotificationEmail(
          'leads@agenthub.com',
          'Lead Tracking - New Service Request',
          {
            service,
            householdZip: household.zip,
            homeType: household.homeType,
            customerEmail: household.email || 'Not provided',
            notes: notes || 'No additional notes',
            leadId: lead.id,
          }
        );
      } catch (emailError) {
        console.error("Error sending lead notification emails:", emailError);
        // Don't fail the API call if email fails
      }

      res.json({ 
        success: true, 
        leadId: lead.id,
        message: "Lead created successfully. A professional will contact you soon."
      });
    } catch (error: any) {
      console.error("Lead creation error:", error);
      if (error?.name === 'ZodError') {
        res.status(400).json({ error: "Invalid lead data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create lead" });
      }
    }
  });

  // Pro Request Routes for "Request a Pro" feature

  // POST /api/pro-requests - Create new pro request 
  app.post("/api/pro-requests", proRequestLimiter, async (req, res) => {
    await createAuditLog(req, '/api/pro-requests');
    try {
      const validatedData = createProRequestSchema.parse(req.body);
      
      // Create the pro request
      const proRequest = await storage.createProRequest(validatedData);

      // Send email notifications
      try {
        // Send confirmation email to user
        await sendUserConfirmationEmail(
          proRequest.contactEmail,
          proRequest.contactName,
          proRequest.id,
          proRequest.publicTrackingCode,
          proRequest.trade
        );
        
        // Send alert email to admin
        await sendAdminAlertEmail(
          proRequest.id,
          proRequest.contactName,
          proRequest.contactEmail,
          proRequest.contactPhone,
          proRequest.trade,
          proRequest.urgency,
          proRequest.description,
          `${proRequest.addressLine1}${proRequest.addressLine2 ? ', ' + proRequest.addressLine2 : ''}, ${proRequest.city}, ${proRequest.state} ${proRequest.zip}`
        );
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Don't fail the request if email fails
      }
      
      res.status(201).json({
        id: proRequest.id,
        publicTrackingCode: proRequest.publicTrackingCode,
        message: "Pro request created successfully. You will receive a confirmation email shortly."
      });
    } catch (error: any) {
      return handleError(error, 'pro-requests creation', res);
    }
  });

  // GET /api/pro-requests/:id - Get pro request by ID (public - returns redacted data)
  app.get("/api/pro-requests/:id", publicApiLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      
      const proRequest = await storage.getProRequest(id);
      if (!proRequest) {
        return res.status(404).json({ error: "Pro request not found" });
      }

      // Return redacted details for public access
      const publicData = {
        id: proRequest.id,
        trade: proRequest.trade,
        urgency: proRequest.urgency,
        description: proRequest.description,
        status: proRequest.status,
        providerAssigned: proRequest.providerAssigned,
        publicTrackingCode: proRequest.publicTrackingCode,
        createdAt: proRequest.createdAt,
        updatedAt: proRequest.updatedAt,
        // Contact info and address are redacted for public access
      };

      res.json(publicData);
    } catch (error: any) {
      return handleError(error, 'pro-requests get', res);
    }
  });

  // GET /api/admin/pro-requests/:id - Get pro request by ID (admin - returns full data)
  app.get("/api/admin/pro-requests/:id", authenticateProAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const proRequest = await storage.getProRequest(id);
      if (!proRequest) {
        return res.status(404).json({ error: "Pro request not found" });
      }

      // Return full details for admin
      res.json(proRequest);
    } catch (error: any) {
      return handleError(error, 'admin pro-requests get', res);
    }
  });

  // GET /api/admin/pro-requests - Get all pro requests with filtering and pagination (admin)
  app.get("/api/admin/pro-requests", authenticateProAdmin, async (req, res) => {
    try {
      await createAuditLog(req, '/api/admin/pro-requests');
      
      // Parse and validate query parameters
      const filters = adminProRequestFiltersSchema.parse({
        status: req.query.status ? (Array.isArray(req.query.status) ? req.query.status : [req.query.status]) : undefined,
        trade: req.query.trade,
        urgency: req.query.urgency,
        zip: req.query.zip,
        providerAssigned: req.query.providerAssigned,
        q: req.query.q,
        page: req.query.page ? Number(req.query.page) : 1,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : 25,
        sortBy: req.query.sortBy || 'createdAt',
        sortDir: req.query.sortDir || 'desc'
      });

      const result = await storage.getAdminProRequests(filters);
      res.json(result);
    } catch (error: any) {
      return handleError(error, 'admin pro-requests list', res);
    }
  });

  // POST /api/admin/pro-requests/:id/notes - Add internal note to pro request (admin)
  app.post("/api/admin/pro-requests/:id/notes", authenticateProAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = createNoteSchema.parse(req.body);
      
      // Check if pro request exists
      const proRequest = await storage.getProRequest(id);
      if (!proRequest) {
        return res.status(404).json({ error: "Pro request not found" });
      }

      // Create the note
      const note = await storage.createNote({
        requestId: id,
        author: 'admin',
        message: validatedData.message
      });

      // Create audit event for note creation
      await storage.createAuditEvent({
        requestId: id,
        actor: 'admin',
        type: 'note_created',
        data: { noteId: note.id, message: validatedData.message }
      });

      res.status(201).json(note);
    } catch (error: any) {
      return handleError(error, 'admin pro-requests note creation', res);
    }
  });

  // GET /api/admin/pro-requests/:id/history - Get audit history for pro request (admin)
  app.get("/api/admin/pro-requests/:id/history", authenticateProAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if pro request exists
      const proRequest = await storage.getProRequest(id);
      if (!proRequest) {
        return res.status(404).json({ error: "Pro request not found" });
      }

      const auditEvents = await storage.getAuditEventsByRequest(id);
      res.json(auditEvents);
    } catch (error: any) {
      return handleError(error, 'admin pro-requests history', res);
    }
  });

  // GET /api/admin/providers - Search providers with filtering (admin)
  app.get("/api/admin/providers", authenticateProAdmin, async (req, res) => {
    try {
      const { trade, zip, q } = req.query;
      
      const providers = await storage.searchProviders(
        trade as string | undefined,
        zip as string | undefined, 
        q as string | undefined
      );
      
      res.json(providers);
    } catch (error: any) {
      return handleError(error, 'admin providers search', res);
    }
  });

  // PATCH /api/pro-requests/:id/status - Update pro request status (admin-only)
  app.patch("/api/pro-requests/:id/status", authenticateProAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const validatedData = updateProRequestStatusSchema.parse(req.body);
      const { status, providerAssigned } = validatedData;
      
      // Get current state for audit trail
      const currentRequest = await storage.getProRequest(id);
      if (!currentRequest) {
        return res.status(404).json({ error: "Pro request not found" });
      }
      
      const updatedRequest = await storage.updateProRequestStatus(id, status, providerAssigned);
      if (!updatedRequest) {
        return res.status(404).json({ error: "Pro request not found" });
      }

      // Create audit events for changes
      const auditEvents = [];
      
      // Track status change
      if (currentRequest.status !== status) {
        auditEvents.push(storage.createAuditEvent({
          requestId: id,
          actor: 'admin',
          type: 'status_change',
          data: { 
            oldStatus: currentRequest.status, 
            newStatus: status 
          }
        }));
      }
      
      // Track provider assignment change
      if (currentRequest.providerAssigned !== providerAssigned) {
        auditEvents.push(storage.createAuditEvent({
          requestId: id,
          actor: 'admin',
          type: 'provider_assignment',
          data: { 
            oldProvider: currentRequest.providerAssigned || null, 
            newProvider: providerAssigned || null 
          }
        }));
      }
      
      // Wait for all audit events to be created
      await Promise.all(auditEvents);

      // Send status update email notification
      try {
        await sendStatusUpdateEmail(
          updatedRequest.contactEmail,
          updatedRequest.contactName,
          updatedRequest.id,
          updatedRequest.publicTrackingCode,
          updatedRequest.trade,
          status,
          providerAssigned
        );
      } catch (emailError) {
        console.error('Status update email error:', emailError);
        // Don't fail the request if email fails
      }

      res.json(updatedRequest);
    } catch (error: any) {
      return handleError(error, 'pro-requests status update', res);
    }
  });

  // GET /api/pro-requests/track/:code - Get pro request by tracking code (public)
  app.get("/api/pro-requests/track/:code", publicApiLimiter, async (req, res) => {
    try {
      const { code } = req.params;
      
      const proRequest = await storage.getProRequestByTrackingCode(code);
      if (!proRequest) {
        return res.status(404).json({ error: "Pro request not found" });
      }

      // Return redacted details for public tracking (same as public GET by ID)
      const publicData = {
        id: proRequest.id,
        trade: proRequest.trade,
        urgency: proRequest.urgency,
        description: proRequest.description,
        status: proRequest.status,
        providerAssigned: proRequest.providerAssigned,
        publicTrackingCode: proRequest.publicTrackingCode,
        createdAt: proRequest.createdAt,
        updatedAt: proRequest.updatedAt,
        // Contact info and address are redacted for public access
      };

      res.json(publicData);
    } catch (error: any) {
      return handleError(error, 'pro-requests track', res);
    }
  });

  // GET /api/providers - Get providers by trade and zip
  app.get("/api/providers", publicApiLimiter, async (req, res) => {
    try {
      const { trade, zip } = req.query;
      
      if (!trade || !zip) {
        return res.status(400).json({ error: "Trade and zip parameters are required" });
      }
      
      const providers = await storage.getProvidersByTradeAndZip(trade as string, zip as string);
      res.json(providers);
    } catch (error: any) {
      return handleError(error, 'providers get', res);
    }
  });

  // POST /api/setup/optin-sms - SMS opt-in with verification
  app.post("/api/setup/optin-sms", smsApiLimiter, async (req, res) => {
    await createAuditLog(req, '/api/setup/optin-sms');
    try {
      const validatedData = smsOptInSchema.parse(req.body);
      const { token, phone } = validatedData;

      // Get household by token
      const household = await storage.getHouseholdByToken(token);
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }

      // Send verification code
      try {
        const { sendVerificationCode } = await import('./lib/sms');
        await sendVerificationCode(phone, token);
        
        res.json({ 
          success: true, 
          message: "Verification code sent to your phone" 
        });
      } catch (smsError) {
        console.error("SMS sending error:", smsError);
        res.status(500).json({ error: "Failed to send verification code" });
      }
    } catch (error: any) {
      console.error("SMS opt-in error:", error);
      if (error?.name === 'ZodError') {
        res.status(400).json({ error: "Invalid phone number or token", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to process SMS opt-in" });
      }
    }
  });

  // POST /api/setup/verify-sms - Verify SMS code and complete opt-in
  app.post("/api/setup/verify-sms", async (req, res) => {
    try {
      const validatedData = smsVerifySchema.parse(req.body);
      const { token, code } = validatedData;

      // Get household by token
      const household = await storage.getHouseholdByToken(token);
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }

      // Verify code
      try {
        const { verifyCode } = await import('./lib/sms');
        const isValid = verifyCode(token, code);
        
        if (!isValid) {
          return res.status(400).json({ error: "Invalid or expired verification code" });
        }

        // Update household with SMS opt-in
        const updatedHousehold = await storage.updateHousehold(household.id, {
          smsOptIn: true,
          phone: req.body.phone || household.phone // Allow phone update during verification
        });

        if (!updatedHousehold) {
          return res.status(500).json({ error: "Failed to update household" });
        }

        // Record SMS opt-in event
        await storage.createEvent({
          householdId: household.id,
          eventType: 'sms_opted_in',
          eventData: JSON.stringify({
            phone: updatedHousehold.phone,
            timestamp: new Date().toISOString()
          }),
        });

        res.json({ 
          success: true, 
          message: "SMS notifications enabled successfully" 
        });
      } catch (smsError) {
        console.error("SMS verification error:", smsError);
        res.status(500).json({ error: "Failed to verify code" });
      }
    } catch (error: any) {
      console.error("SMS verification error:", error);
      if (error?.name === 'ZodError') {
        res.status(400).json({ error: "Invalid verification code or token", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to verify SMS code" });
      }
    }
  });

  // GET /api/download/batch/:batchId - Download CSV for agent packs
  app.get("/api/download/batch/:batchId", async (req, res) => {
    try {
      const { batchId } = req.params;
      
      // Handle "demo" as a special case - serve the test file
      let csvFilePath: string;
      let downloadFileName: string;
      
      if (batchId === 'demo') {
        csvFilePath = path.join(process.cwd(), 'exports', 'batch-test.csv');
        downloadFileName = 'magnet-batch-demo.csv';
      } else {
        csvFilePath = path.join(process.cwd(), 'exports', `batch-${batchId}.csv`);
        downloadFileName = `magnet-batch-${batchId}.csv`;
      }
      
      if (!fs.existsSync(csvFilePath)) {
        return res.status(404).json({ error: "CSV file not found" });
      }

      res.download(csvFilePath, downloadFileName, (err) => {
        if (err) {
          console.error("Error downloading file:", err);
          res.status(500).json({ error: "Failed to download file" });
        }
      });
    } catch (error: any) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  // Agent Routes - Authentication and Dashboard
  
  // POST /api/agent/login - Mock agent login
  app.post("/api/agent/login", authApiLimiter, async (req, res) => {
    await createAuditLog(req, '/api/agent/login');
    try {
      const validatedData = agentLoginSchema.parse(req.body);
      const { email } = validatedData;

      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: "JWT_SECRET not configured" });
      }

      // Mock agent ID generation (in real app, validate against agent database)
      const agentId = email.split('@')[0]; // Simple mock: use email prefix as agent ID
      
      // Generate JWT token
      const token = jwt.sign(
        { agentId, email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        agent: {
          id: agentId,
          email
        }
      });
    } catch (error: any) {
      console.error("Agent login error:", error);
      if (error?.name === 'ZodError') {
        res.status(400).json({ error: "Invalid email format", details: error.errors });
      } else {
        res.status(500).json({ error: "Login failed" });
      }
    }
  });

  // GET /api/agent/metrics - Agent dashboard metrics
  app.get("/api/agent/metrics", authenticateAgent, async (req, res) => {
    try {
      const agentId = (req as any).agentId;
      
      const metrics = await storage.getAgentMetrics(agentId);
      
      res.json(metrics);
    } catch (error: any) {
      console.error("Error fetching agent metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // GET /api/agent/households - Agent households list
  app.get("/api/agent/households", authenticateAgent, async (req, res) => {
    try {
      const agentId = (req as any).agentId;
      
      const households = await storage.getActivatedHouseholdsByAgentId(agentId);
      
      res.json(households.map(household => ({
        id: household.id,
        zip: household.zip,
        city: household.city,
        homeType: household.homeType,
        email: household.email,
        activatedAt: household.activatedAt,
        lastReminder: household.lastReminder
      })));
    } catch (error: any) {
      console.error("Error fetching agent households:", error);
      res.status(500).json({ error: "Failed to fetch households" });
    }
  });

  // GET /api/agent/batches - Agent batches list
  app.get("/api/agent/batches", authenticateAgent, async (req, res) => {
    try {
      const agentId = (req as any).agentId;
      
      const batches = await storage.getBatchesByAgentId(agentId);
      
      res.json(batches.map(batch => ({
        id: batch.id,
        qty: batch.qty,
        createdAt: batch.createdAt
      })));
    } catch (error: any) {
      console.error("Error fetching agent batches:", error);
      res.status(500).json({ error: "Failed to fetch batches" });
    }
  });

  // GET /api/agents - Get all agents (Public endpoint for testing)
  app.get("/api/agents", async (req, res) => {
    try {
      // For now, return mock data since this endpoint is primarily for testing
      const mockAgents = [
        {
          id: "agent1",
          email: "agent1@example.com",
          createdAt: new Date().toISOString(),
          householdCount: 5,
          totalMagnets: 100
        },
        {
          id: "agent2", 
          email: "agent2@example.com",
          createdAt: new Date().toISOString(),
          householdCount: 3,
          totalMagnets: 50
        }
      ];
      
      res.json(mockAgents);
    } catch (error: any) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ error: "Failed to fetch agents" });
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

  // GET /api/admin/qr/:token - Generate QR code PNG for setup token
  app.get("/api/admin/qr/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      // Generate setup URL for the token
      const baseUrl = req.protocol + '://' + req.get('host');
      const setupUrl = `${baseUrl}/setup/${token}`;

      // Generate QR code as PNG buffer
      const qrBuffer = await QRCode.toBuffer(setupUrl, {
        type: 'png',
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="qr-${token}.png"`);
      res.send(qrBuffer);
      
    } catch (error) {
      console.error("Error generating QR code for token:", error);
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  });

  // GET /api/admin/batches/:id/sheet.pdf - Generate proof sheet PDF
  app.get("/api/admin/batches/:id/sheet.pdf", async (req, res) => {
    try {
      const batchId = req.params.id;
      
      const { generateBatchProofSheet } = await import('./lib/pdf');
      const pdfBuffer = await generateBatchProofSheet(batchId);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="batch-${batchId}-proof.pdf"`);
      res.send(pdfBuffer);
      
    } catch (error: any) {
      console.error("Error generating proof sheet:", error);
      if (error.message === 'Batch not found' || error.message === 'No magnets found for this batch') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to generate proof sheet" });
      }
    }
  });

  // POST /api/admin/trigger-reminders - Manual reminder processing
  app.post("/api/admin/trigger-reminders", authenticateAdmin, async (req, res) => {
    try {
      const { triggerReminderProcessing } = await import('./lib/cron');
      await triggerReminderProcessing();
      res.json({ success: true, message: "Reminder processing triggered" });
    } catch (error: any) {
      return handleError(error, 'admin/trigger-reminders', res);
    }
  });

  // Contact form handler with redirect support
  app.post("/api/contact", publicApiLimiter, express.json(), express.urlencoded({ extended: true }), async (req, res) => {
    try {
      // Check honeypot field for spam protection
      if (req.body.website) {
        console.log('Spam detected: honeypot field filled');
        return res.status(400).json({ message: 'Invalid submission' });
      }

      const { name, email, phone, topic, subject, zip, message, consent, to } = req.body;

      // Handle both old WordPress format and new Contact page format
      const formSubject = subject || topic || 'Contact Form Submission';
      const recipient = to || 'Support@UpKeepQr.Com';

      // Validate required fields (more flexible for both formats)
      if (!name || !email || !message) {
        console.log('Missing required fields in contact form');
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Send email using SendGrid
      try {
        const { sendEmail: sendGridEmail } = await import('./sendgrid');
        
        const emailSent = await sendGridEmail({
          to: recipient,
          from: 'Support@UpKeepQr.Com', // Must be a verified sender in SendGrid
          subject: `Contact Form: ${formSubject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            <p><strong>Subject:</strong> ${formSubject}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          `,
          text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}\n` : ''}Subject: ${formSubject}
Message: ${message}
          `
        });

        if (!emailSent) {
          throw new Error('Failed to send email via SendGrid');
        }

        console.log(`✅ Contact form email sent to ${recipient} from ${email}`);
      } catch (emailError) {
        console.error('SendGrid email error:', emailError);
        // Fall back to existing email system if SendGrid fails
        if (topic && consent !== undefined) {
          await handleContactFormSubmission({
            name: name.trim(),
            email: email.trim(),
            phone: phone?.trim() || '',
            topic: (topic || subject).trim(),
            zip: zip?.trim() || '',
            message: message.trim(),
            consent: consent === 'on' || consent === 'true'
          });
        }
      }

      await createAuditLog(req, 'contact form submission');
      console.log(`✅ Contact form submitted by ${email} (${formSubject})`);
      
      res.status(200).json({ message: 'Contact form submitted successfully' });
    } catch (error: any) {
      console.error('Contact form submission error:', error);
      await createAuditLog(req, `contact form error: ${error.message}`);
      res.status(500).json({ message: 'Contact form submission failed' });
    }
  });

  // Website removed - now using WordPress instead of Astro/Firebase hosting

  // Serve React app at /app for agent management
  app.get('/app*', (req, res, next) => {
    // Let the React app handle /app routes
    next();
  });

  const httpServer = createServer(app);

  return httpServer;
}

// Helper function to handle enhanced contact form submissions
async function handleContactFormSubmission(data: {
  name: string;
  email: string;
  phone: string;
  topic: string;
  zip: string;
  message: string;
  consent: boolean;
}) {
  const { name, email, phone, topic, zip, message } = data;

  try {
    // Send contact form emails (customer confirmation + support notification)
    await sendContactFormEmails({
      name,
      email,
      phone,
      topic,
      zip,
      message
    });
    
    console.log(`✅ Contact form emails sent for ${email} (${topic})`);
  } catch (error) {
    console.error('Error sending contact form emails:', error);
    throw new Error('Failed to send confirmation emails');
  }
}
