console.log("DEBUG DATABASE_URL:", process.env.DATABASE_URL);

import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { setupRoutes } from "./src/routes/index.js";
import { startCronJobs } from "./lib/cron.js";
import { setupVite, serveStatic, log } from "./vite.js";

const app = express();

app.set('trust proxy', true);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  
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
  setupRoutes(app);
  
  // Now add JSON parsing for other routes (after webhook raw body handling)
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  startCronJobs();
  
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
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
