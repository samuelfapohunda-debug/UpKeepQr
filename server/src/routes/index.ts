import { Express } from 'express';
import healthRoutes from './health.js';
import authRoutes from './auth.js';
import qrRoutes from './qr.js';
import calendarRoutes from './calendar.js';
import homeExtraRoutes from './homeExtra.js';
import webhookRoutes from './webhook.js';
import publicHomeExtraRoutes from './publicHomeExtra.js';
import leadsRoutes from './leads.js';
import setupRoutes from './setup.ts';
import magnetOrdersRoutes from './magnet-orders.js';
import publicRoutes from './public.js';

export function registerRoutes(app: Express) {
  app.use('/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/qr', qrRoutes);
  app.use('/api/calendar', calendarRoutes);
  app.use('/api/admin/home-extra', homeExtraRoutes);
  app.use('/api/admin/magnets', magnetOrdersRoutes);
  app.use('/api/public', publicHomeExtraRoutes);
  app.use('/api/webhook', webhookRoutes);
  app.use('/api/leads', leadsRoutes);
  app.use('/api/setup', setupRoutes);
  app.use('/api', publicRoutes);  // Customer data lookup and QR code download
  
  console.log('✅ Health routes registered at /health');
  console.log('✅ Auth routes registered at /api/auth');
  console.log('✅ QR routes registered at /api/qr');
  console.log('✅ Calendar routes registered at /api/calendar');
  console.log('✅ Admin home extra routes registered at /api/admin/home-extra');
  console.log('✅ Admin magnet orders routes registered at /api/admin/magnets');
  console.log('✅ Public home extra routes registered at /api/public');
  console.log('✅ Webhook routes registered at /api/webhook');
  console.log('✅ Leads routes registered at /api/leads');
  console.log('✅ Setup routes registered at /api/setup');
  console.log('�� All routes setup complete');
}
