import { Express } from 'express';
import healthRoutes from './health.js';
import authRoutes from './auth.js';
import qrRoutes from './qr.js';
import calendarRoutes from './calendar.js';
import homeExtraRoutes from './homeExtra.js';
import webhookRoutes from './webhook.js';

export function setupRoutes(app: Express) {
  console.log('📋 Setting up routes...');
  
  // Health check route
  app.use('/health', healthRoutes);
  console.log('✅ Health routes registered at /health');
  
  // Webhook routes (includes raw body middleware internally)
  app.use('/api', webhookRoutes);
  console.log('✅ Webhook routes registered at /api');
  
  // API routes
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes registered at /api/auth');
  
  app.use('/api/qr', qrRoutes);
  console.log('✅ QR routes registered at /api/qr');
  
  app.use('/api/calendar', calendarRoutes);
  console.log('✅ Calendar routes registered at /api/calendar');
  
  app.use('/api', homeExtraRoutes);
  console.log('✅ HomeExtra routes registered at /api');
  
  console.log('📋 All routes setup complete');
}
