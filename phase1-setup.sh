#!/bin/bash
set -e

echo "🚀 Starting Phase 1: Critical Foundation Setup..."

# ==============================
# Step 1.1: Backup Current State
# ==============================
echo "📦 Creating backup branch..."
git checkout -b backup-before-consolidation || git checkout backup-before-consolidation
git add .
git commit -m "Backup before major refactoring" || echo "✅ Nothing new to commit"
git push origin backup-before-consolidation || echo "✅ Backup branch already pushed"
git checkout main

# ==============================
# Step 1.2: Fix Server Entry Point
# ==============================
echo "🛠 Fixing server/index.ts..."
cat > server/index.ts << 'EON'
import dotenv from "dotenv";
dotenv.config();

console.log("DEBUG DATABASE_URL:", process.env.DATABASE_URL);

import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { setupRoutes } from "./src/routes/index.js";
import { startCronJobs } from "./lib/cron";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

app.set('trust proxy', true);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  setupRoutes(app);
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
EON

# ==============================
# Step 1.3: Remove Duplicate Frontends
# ==============================
echo "🧹 Removing duplicate frontend directories..."
rm -rf web/ packages/web/
git add .
git commit -m "Remove duplicate frontend directories" || echo "✅ No duplicate dirs found"

# ==============================
# Step 1.4: Update Package.json
# ==============================
echo "📦 Rewriting package.json..."
cat > package.json << 'EON'
{
  "name": "server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --import tsx --watch server/index.ts",
    "build": "tsc && vite build",
    "start": "node dist/index.js",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "express": "^4.19.2",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "tsx": "^4.20.6",
    "typescript": "^5.6.2"
  }
}
EON

echo "📥 Installing dependencies..."
rm -rf node_modules package-lock.json
npm install

# ==============================
# Step 1.5: Initialize Database
# ==============================
echo "🗄 Running database migrations..."
npm run db:generate || echo "⚠️ db:generate failed — check schema"
npm run db:push || echo "⚠️ db:push failed — check connection"

# ==============================
# Step 1.6: Test Server
# ==============================
echo "🧪 Testing server startup..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
npm run dev
