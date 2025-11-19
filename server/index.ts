console.log("DEBUG DATABASE_URL:", process.env.DATABASE_URL);
import cors from "cors";

import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./src/routes/index";
import { startCronJobs } from "./lib/cron.js";
import { setupVite, serveStatic, log } from "./vite.js";

const app = express();

// Set trust proxy to 1 for Replit's single-hop proxy (more secure than `true`)
app.set('trust proxy', 1);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined;
  
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });
  next();
});

(async () => {
  // 🚨 CRITICAL: Setup routes BEFORE Vite middleware
  // 🚨 CORS Configuration - Must be FIRST
  app.use(cors({
    origin: [
      'https://infamous-werewolf-v67jxv7jgxwhx7w4-5000.app.github.dev',
      'http://localhost:5173',
      'http://localhost:5000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // ⚡ CRITICAL: Stripe webhook needs raw body BEFORE express.json() parses it
  app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  // Bootstrap: Ensure system agent exists for order-based QR codes
  const { storage, SYSTEM_AGENT_ID } = await import("./storage.js");
  const ensureSystemAgent = async () => {
    try {
      const existingAgent = await storage.getAgent(SYSTEM_AGENT_ID);
      if (!existingAgent) {
        console.log('🔧 Creating system agent for order-based QR codes...');
        await storage.createAgent({
          id: SYSTEM_AGENT_ID,
          name: 'UpKeepQR System',
          email: 'system@upkeepqr.com',
          password: 'N/A', // System agent cannot log in
        });
        console.log('✅ System agent created successfully');
      } else {
        console.log('✅ System agent already exists');
      }
    } catch (error) {
      console.error('❌ Failed to ensure system agent exists:', error);
      throw error; // Fatal error - app cannot work without system agent
    }
  };
  await ensureSystemAgent();
  
  registerRoutes(app);
  
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Error:", err);
    const status = err?.status || err?.statusCode || 500;
    const message = err?.message || "Internal Server Error";
    res.status(status).json({ error: message });
  });
  
  const server = createServer(app);
  
  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    log(`Server running on port ${port}`);
  });
})();
