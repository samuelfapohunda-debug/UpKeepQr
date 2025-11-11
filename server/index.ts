console.log("DEBUG DATABASE_URL:", process.env.DATABASE_URL);
import cors from "cors";

import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./src/routes/index.ts";
import { registerRoutes as registerLegacyRoutes } from "./routes.ts";
import { startCronJobs } from "./lib/cron.js";
import { setupVite, serveStatic, log } from "./vite.js";

const app = express();

app.set('trust proxy', true);

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

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  registerRoutes(app);
  
  // Register legacy admin routes (TODO: migrate to modular system)
  await registerLegacyRoutes(app);
  
  startCronJobs();
  
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Error:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
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
