import { Express } from 'express';
import healthRoutes from './health.js';
import authRoutes from './auth.js';
import adminAuthRoutes from './adminAuth.js';
import qrRoutes from './qr.js';
import calendarRoutes from './calendar.js';
import homeExtraRoutes from './homeExtra.js';
import webhookRoutes from './webhook.js';
import publicHomeExtraRoutes from './publicHomeExtra.js';
import leadsRoutes from './leads.js';
import setupRoutes from './setup.ts';
import magnetOrdersRoutes from './magnet-orders.js';
import setupFormsRoutes from './setup-forms.js';
import publicRoutes from './public.js';
import contactRoutes from './contact.js';
import proRequestsRoutes from './proRequests.js';
import adminProRequestsRoutes from './adminProRequests.js';
import applianceRoutes from './appliances.js';
import maintenanceLogRoutes from './maintenanceLogs.js';
import reportRoutes from './reports.js';
import householdsRoutes from './households.js';
import checkoutRoutes from './checkout.js';
import dashboardRoutes from './dashboard.js';
import customerRoutes from './customer.js';

export function registerRoutes(app: Express) {
  app.use('/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/auth/admin', adminAuthRoutes);
  app.use('/api/qr', qrRoutes);
  app.use('/api/calendar', calendarRoutes);
  app.use('/api/admin/home-extra', homeExtraRoutes);
  app.use('/api/admin/magnets', magnetOrdersRoutes);
  app.use('/api/admin/setup-forms', setupFormsRoutes);
  app.use('/api/admin/pro-requests', adminProRequestsRoutes);  // Admin pro requests dashboard
  app.use('/api/public', publicHomeExtraRoutes);
  app.use('/api/webhook', webhookRoutes);
  app.use('/api/leads', leadsRoutes);
  app.use('/api/setup', setupRoutes);
  app.use('/api/pro-requests', proRequestsRoutes);  // Public professional service requests
  app.use('/api', contactRoutes);  // Contact form
  app.use('/api', publicRoutes);  // Customer data lookup and QR code download
  app.use('/api', applianceRoutes);  // Appliance management
  app.use('/api', maintenanceLogRoutes);  // Maintenance logs
  app.use('/api', reportRoutes);  // Reports
  app.use('/api', householdsRoutes);  // Households tasks
  app.use('/api/checkout', checkoutRoutes);  // Stripe checkout
  app.use('/api', dashboardRoutes);  // Homeowner dashboard
  app.use('/api/customer', customerRoutes);  // Customer authenticated routes
  app.use('/api/appliances', applianceRoutes);  // Appliance management routes
  app.use('/api/households', householdsRoutes);  // Households routes
  
  console.log('✅ Health routes registered at /health');
  console.log('✅ Dashboard routes registered at /api/dashboard');
  console.log('✅ Checkout routes registered at /api/checkout');
  console.log('✅ Auth routes registered at /api/auth');
  console.log('✅ Admin auth routes registered at /api/auth/admin');
  console.log('✅ QR routes registered at /api/qr');
  console.log('✅ Calendar routes registered at /api/calendar');
  console.log('✅ Admin home extra routes registered at /api/admin/home-extra');
  console.log('✅ Admin magnet orders routes registered at /api/admin/magnets');
  console.log('✅ Admin setup forms routes registered at /api/admin/setup-forms');
  console.log('✅ Admin pro requests routes registered at /api/admin/pro-requests');
  console.log('✅ Public home extra routes registered at /api/public');
  console.log('✅ Webhook routes registered at /api/webhook');
  console.log('✅ Leads routes registered at /api/leads');
  console.log('✅ Setup routes registered at /api/setup');
  console.log('✅ Pro requests routes registered at /api/pro-requests');
  console.log('✅ Contact routes registered at /api/contact');
  console.log('✅ Appliance routes registered at /api');
  console.log('✅ Maintenance log routes registered at /api');
  console.log('✅ Report routes registered at /api');
  console.log('✅ Households routes registered at /api');
  console.log('🚀 All routes setup complete');
}
