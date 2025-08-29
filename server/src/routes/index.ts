import { Express } from 'express';
import healthRoutes from './health.js';
import authRoutes from './auth.js';
import qrRoutes from './qr.js';
import calendarRoutes from './calendar.js';

export function setupRoutes(app: Express) {
  // Health check route
  app.use('/health', healthRoutes);
  
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/qr', qrRoutes);
  app.use('/api/calendar', calendarRoutes);
}
