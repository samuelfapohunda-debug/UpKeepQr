import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateAdmin } from "./middleware/auth";
import { insertBatchSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
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
