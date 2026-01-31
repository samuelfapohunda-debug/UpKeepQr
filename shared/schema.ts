import { z } from "zod";
import { pgTable, serial, varchar, text, integer, boolean, timestamp, json, numeric, jsonb, index, date, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";

// Firebase Timestamp type
export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

// Agent schema for Firebase
export const agentSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string().optional(), // Not stored in Firestore, handled by Firebase Auth
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Agent = z.infer<typeof agentSchema>;
export type InsertAgent = z.infer<typeof agentSchema>;

// Magnet schema for Firebase
export const magnetSchema = z.object({
  id: z.string(), // UUID
  batchId: z.string(),
  agentId: z.string(),
  token: z.string(),
  isUsed: z.boolean().default(false),
  setupUrl: z.string().optional(),
  url: z.string().optional(), // Legacy support for some routes
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Magnet = z.infer<typeof magnetSchema>;
export type InsertMagnet = z.infer<typeof magnetSchema>;

// Magnet batch schema for Firebase
export const magnetBatchSchema = z.object({
  id: z.string(), // UUID
  agentId: z.string(),
  qty: z.number(),
  csvPath: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type MagnetBatch = z.infer<typeof magnetBatchSchema>;
export type InsertMagnetBatch = z.infer<typeof magnetBatchSchema>;

// Household schema for Firebase
export const householdSchema = z.object({
  id: z.string(), // UUID
  magnetToken: z.string(),
  agentId: z.string(),
  name: z.string(),
  email: z.string().email(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  homeType: z.enum(['single_family', 'condo', 'townhouse', 'apartment', 'mobile', 'other']),
  climateZone: z.string().optional(),
  phone: z.string().optional(),
  smsOptIn: z.boolean().optional().default(false),
  country: z.enum(['US', 'CA']).optional().default('US'),
  preferredContact: z.enum(['email', 'phone', 'text']).optional(),
  preferredContactTime: z.enum(['morning', 'afternoon', 'evening']).optional(),
  heatPump: z.enum(['yes', 'no', 'unknown']).optional(),
  sqft: z.number().positive().optional(),
  hvacType: z.string().optional(),
  waterHeater: z.string().optional(),
  roofAgeYears: z.number().min(0).max(100).optional(),
  interestType: z.enum(['sales', 'rent', 'lease', 'maintenance']).optional(),
  needConsultation: z.boolean().optional(),
  budgetRange: z.string().optional(),
  timelineToProceed: z.string().optional(),
  notes: z.string().optional(),
  activatedAt: z.date().optional(),
  lastReminder: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type HouseholdFirebase = z.infer<typeof householdSchema>;
export type InsertHouseholdFirebase = z.infer<typeof householdSchema>;

// Task schema for Firebase
export const taskSchema = z.object({
  id: z.string(), // UUID
  householdId: z.string(),
  agentId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  category: z.enum(['hvac', 'plumbing', 'electrical', 'roofing', 'gutters', 'windows', 'doors', 'flooring', 'exterior', 'interior', 'appliances', 'other']),
  frequency: z.enum(['once', 'monthly', 'quarterly', 'biannually', 'annually', 'custom']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['pending', 'completed', 'skipped', 'overdue']).default('pending'),
  scheduledDate: z.date(),
  completedAt: z.date().optional(),
  notes: z.string().optional(),
  reminderSent: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Task = z.infer<typeof taskSchema>;
export type InsertTask = z.infer<typeof taskSchema>;

// Lead schema for Firebase
export const leadSchema = z.object({
  id: z.string(), // UUID
  agentId: z.string(),
  householdId: z.string().optional(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  homeType: z.enum(['single_family', 'condo', 'townhouse', 'apartment', 'mobile', 'other']).optional(),
  serviceInterest: z.enum(['hvac', 'plumbing', 'electrical', 'roofing', 'gutters', 'windows', 'doors', 'flooring', 'exterior', 'interior', 'appliances', 'general']).optional(),
  service: z.string().optional(), // Legacy support
  status: z.enum(['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost']).default('new'),
  source: z.enum(['magnet_setup', 'referral', 'website', 'social', 'advertising', 'other']).default('magnet_setup'),
  notes: z.string().optional(),
  estimatedValue: z.number().optional(),
  followUpDate: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Lead = z.infer<typeof leadSchema>;
export type InsertLead = z.infer<typeof leadSchema>;

// Helper functions for Firebase Timestamp conversion
export function timestampToDate(timestamp: FirebaseTimestamp | Date | undefined): Date | undefined {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
}

export function dateToTimestamp(date: Date | undefined): FirebaseTimestamp | undefined {
  if (!date) return undefined;
  const seconds = Math.floor(date.getTime() / 1000);
  const nanoseconds = (date.getTime() % 1000) * 1000000;
  return { seconds, nanoseconds };
}

// Collection names for Firebase
export const COLLECTIONS = {
  AGENTS: 'agents',
  MAGNETS: 'magnets', 
  MAGNET_BATCHES: 'magnetBatches',
  HOUSEHOLDS: 'households',
  TASKS: 'tasks',
  LEADS: 'leads'
} as const;

// Insert schemas
export const insertAgentSchema = agentSchema.omit({ createdAt: true, updatedAt: true });
export const insertMagnetBatchSchema = magnetBatchSchema.omit({ createdAt: true, updatedAt: true });
export const insertMagnetSchema = magnetSchema.omit({ createdAt: true, updatedAt: true });
export const insertHouseholdSchema = householdSchema.omit({ createdAt: true, updatedAt: true });
export const insertTaskSchema = taskSchema.omit({ createdAt: true, updatedAt: true });
export const insertLeadSchema = leadSchema.omit({ createdAt: true, updatedAt: true });

// Batch creation schema for admin API
export const insertBatchSchema = z.object({
  agentId: z.string().min(1),
  qty: z.number().positive().max(1000),
});

// Setup and API schemas
export const setupActivateSchema = z.object({
  token: z.string().optional(), // Optional for admin-created households
  
  // Personal Details (REQUIRED)
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  preferredContact: z.enum(['email', 'phone', 'text']).optional(),
  preferredContactTime: z.enum(['morning', 'afternoon', 'evening']).optional(),
  smsOptIn: z.boolean().optional().default(false),
  
  // Home Details
  country: z.enum(['US', 'CA']).optional().default('US'),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(), // Optional - backend supports both postalCode and zip
  
  // Legacy support
  zip: z.string().optional(), // Backend uses postalCode || zip
  
  // Admin fields (server-only, not sent by client)
  skipWelcomeEmail: z.boolean().optional().default(false),
  // NOTE: adminCreated removed - server derives admin mode from auth, never trusts client
  homeType: z.string().optional(),
  yearBuilt: z.number().min(1800).max(new Date().getFullYear()).optional(),
  sqft: z.number().positive().optional(),
  bedrooms: z.number().min(0).max(20).optional(),
  bathrooms: z.number().min(0).max(20).optional(),
  hvacType: z.string().optional(),
  heatPump: z.enum(['yes', 'no', 'unknown']).optional(),
  waterHeater: z.string().optional(),
  roofAgeYears: z.number().min(0).max(100).optional(),
  isOwner: z.boolean().optional(),
  
  // Interest Details
  interestType: z.enum(['sales', 'rent', 'lease', 'maintenance']).optional(),
  needConsultation: z.boolean().optional(),
  budgetRange: z.string().optional(),
  timelineToProceed: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // Either postalCode or zip must be provided
  return data.postalCode || data.zip;
}, {
  message: "Either postalCode or zip must be provided",
  path: ["postalCode"],
});

export const setupPreviewSchema = z.object({
  zip: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
  homeType: z.string().min(1),
  sqft: z.number().positive().optional(),
  hvacType: z.string().optional(),
  waterHeater: z.string().optional(),
  roofAgeYears: z.number().min(0).max(100).optional(),
});

export const taskCompleteSchema = z.object({
  householdToken: z.string().min(1),
  task_code: z.string().min(1),
});

export const agentLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const checkoutSchema = z.object({
  sku: z.enum(['100pack', '500pack', 'single', 'twopack']),
  agentId: z.string().optional(),
});

export const leadsSchema = z.object({
  householdToken: z.string().min(1),
  service: z.enum(['hvac', 'gutter', 'plumbing', 'electrical', 'roofing', 'flooring', 'painting', 'landscaping']),
  notes: z.string().optional(),
});

export const smsOptInSchema = z.object({
  token: z.string().min(1),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
});

export const smsVerifySchema = z.object({
  token: z.string().min(1),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

// Home Maintenance Task schema for PostgreSQL
export const homeMaintenanceTaskSchema = z.object({
  id: z.number(),
  taskCode: z.string(),
  category: z.string(),
  taskName: z.string(),
  baseFrequency: z.string(),
  monthsHotHumid: z.string().nullable(),
  monthsColdSnow: z.string().nullable(),
  monthsMixed: z.string().nullable(),
  monthsAridMountain: z.string().nullable(),
  seasonalTag: z.string().nullable(),
  howTo: z.string(),
  whyItMatters: z.string(),
  estMinutes: z.number(),
  materials: z.string().nullable(),
  safetyNote: z.string().nullable(),
  appliesIfFreeze: z.boolean(),
  appliesIfHurricane: z.boolean(),
  appliesIfWildfire: z.boolean(),
  appliesIfHardWater: z.boolean(),
  appliesIfHasSprinklers: z.boolean(),
  proServiceRecommended: z.boolean(),
  diyOk: z.boolean(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type HomeMaintenanceTask = z.infer<typeof homeMaintenanceTaskSchema>;

// Drizzle table definitions for PostgreSQL
export const homeMaintenanceTasksTable = pgTable("home_maintenance_tasks", {
  id: serial("id").primaryKey(),
  taskCode: varchar("task_code", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  taskName: varchar("task_name", { length: 255 }).notNull(),
  baseFrequency: varchar("base_frequency", { length: 50 }).notNull(),
  monthsHotHumid: varchar("months_hot_humid", { length: 50 }),
  monthsColdSnow: varchar("months_cold_snow", { length: 50 }),
  monthsMixed: varchar("months_mixed", { length: 50 }),
  monthsAridMountain: varchar("months_arid_mountain", { length: 50 }),
  seasonalTag: varchar("seasonal_tag", { length: 50 }),
  howTo: text("how_to").notNull(),
  whyItMatters: text("why_it_matters").notNull(),
  estMinutes: integer("est_minutes").notNull(),
  materials: text("materials"),
  safetyNote: text("safety_note"),
  appliesIfFreeze: boolean("applies_if_freeze").notNull().default(false),
  appliesIfHurricane: boolean("applies_if_hurricane").notNull().default(false),
  appliesIfWildfire: boolean("applies_if_wildfire").notNull().default(false),
  appliesIfHardWater: boolean("applies_if_hard_water").notNull().default(false),
  appliesIfHasSprinklers: boolean("applies_if_has_sprinklers").notNull().default(false),
  proServiceRecommended: boolean("pro_service_recommended").notNull().default(false),
  diyOk: boolean("diy_ok").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create insert schema using drizzle-zod
export const insertHomeMaintenanceTaskSchema = createInsertSchema(homeMaintenanceTasksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHomeMaintenanceTask = z.infer<typeof insertHomeMaintenanceTaskSchema>;

// Type exports
export type SetupActivateRequest = z.infer<typeof setupActivateSchema>;
export type SetupPreviewRequest = z.infer<typeof setupPreviewSchema>;
export type TaskCompleteRequest = z.infer<typeof taskCompleteSchema>;
export type LeadsRequest = z.infer<typeof leadsSchema>;
export type SmsOptInRequest = z.infer<typeof smsOptInSchema>;
export type SmsVerifyRequest = z.infer<typeof smsVerifySchema>;

// Pro Request schema for "Request a Pro" feature
export const proRequestSchema = z.object({
  id: z.string(), // UUID
  trade: z.enum(['roofing', 'plumbing', 'electrical', 'hvac', 'general']),
  urgency: z.enum(['emergency', '24h', '3days', 'flexible']),
  description: z.string().min(1).max(2000),
  photos: z.array(z.string()).max(5).default([]), // Array of URLs
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1),
  preferredWindows: z.string().optional(),
  status: z.enum(['new', 'assigned', 'in_progress', 'completed', 'canceled']).default('new'),
  providerAssigned: z.string().optional(),
  publicTrackingCode: z.string(), // Short slug for public tracking
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type ProRequest = z.infer<typeof proRequestSchema>;

// Provider schema for directory
export const providerSchema = z.object({
  id: z.string(), // UUID
  name: z.string().min(1),
  trade: z.enum(['roofing', 'plumbing', 'electrical', 'hvac', 'general']),
  coverageZips: z.array(z.string()),
  email: z.string().email(),
  phone: z.string().min(1),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Provider = z.infer<typeof providerSchema>;

// Pro Request Drizzle table definition
export const proRequestsTable = pgTable("pro_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trade: varchar("trade", { length: 50 }).notNull(),
  urgency: varchar("urgency", { length: 50 }).notNull(),
  description: text("description").notNull(),
  photos: json("photos").$type<string[]>().default([]),
  addressLine1: varchar("address_line_1", { length: 255 }).notNull(),
  addressLine2: varchar("address_line_2", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  zip: varchar("zip", { length: 5 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }).notNull(),
  preferredWindows: text("preferred_windows"),
  status: varchar("status", { length: 50 }).notNull().default('new'),
  providerAssigned: varchar("provider_assigned", { length: 255 }),
  publicTrackingCode: varchar("public_tracking_code", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider Drizzle table definition
export const providersTable = pgTable("providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  trade: varchar("trade", { length: 50 }).notNull(),
  coverageZips: json("coverage_zips").$type<string[]>().notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for Pro Requests
export const insertProRequestSchema = proRequestSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  publicTrackingCode: true,
  status: true 
});
export type InsertProRequest = z.infer<typeof insertProRequestSchema>;

// Insert schemas for Providers  
export const insertProviderSchema = providerSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export type InsertProvider = z.infer<typeof insertProviderSchema>;

// API request schemas
export const createProRequestSchema = z.object({
  trade: z.enum(['roofing', 'plumbing', 'electrical', 'hvac', 'general']),
  urgency: z.enum(['emergency', '24h', '3days', 'flexible']),
  description: z.string().min(1).max(2000),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1),
  preferredWindows: z.string().optional(),
});

export const updateProRequestStatusSchema = z.object({
  status: z.enum(['new', 'assigned', 'in_progress', 'completed', 'canceled']),
  providerAssigned: z.string().optional(),
});

// Type exports for API
export type CreateProRequestRequest = z.infer<typeof createProRequestSchema>;
export type UpdateProRequestStatusRequest = z.infer<typeof updateProRequestStatusSchema>;

// Audit Event schema for tracking changes
export const auditEventSchema = z.object({
  id: z.string(), // UUID
  requestId: z.string().nullable().optional(), // Foreign key to pro_requests (nullable for household events)
  householdId: z.string().nullable().optional(), // Foreign key to households
  orderId: z.string().nullable().optional(), // Foreign key to orders
  actor: z.string().default('admin'),
  type: z.enum([
    'status_change', 
    'provider_assignment', 
    'note_created',
    'qr_activated',
    'admin_household_created',
    'household_updated',
    'household_deleted'
  ]),
  data: z.record(z.any()), // JSON data for storing diff or payload
  createdAt: z.date().optional(),
});

export type AuditEvent = z.infer<typeof auditEventSchema>;

// Note schema for internal notes
export const noteSchema = z.object({
  id: z.string(), // UUID
  requestId: z.string(), // Foreign key to pro_requests
  author: z.string().default('admin'),
  message: z.string().min(1).max(2000),
  createdAt: z.date().optional(),
});

export type Note = z.infer<typeof noteSchema>;

// Audit Event Drizzle table definition
export const auditEventsTable = pgTable("audit_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id", { length: 255 }), // Nullable for household events
  householdId: varchar("household_id", { length: 255 }), // For household-related events
  orderId: varchar("order_id", { length: 255 }), // For order-related events
  actor: varchar("actor", { length: 100 }).notNull().default('admin'),
  type: varchar("type", { length: 50 }).notNull(),
  data: json("data").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Note Drizzle table definition
export const notesTable = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id", { length: 255 }).notNull(),
  author: varchar("author", { length: 100 }).notNull().default('admin'),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertAuditEventSchema = auditEventSchema.omit({ 
  id: true, 
  createdAt: true 
});
export type InsertAuditEvent = z.infer<typeof insertAuditEventSchema>;

export const insertNoteSchema = noteSchema.omit({ 
  id: true, 
  createdAt: true 
});
export type InsertNote = z.infer<typeof insertNoteSchema>;

// Admin API request schemas
export const createNoteSchema = z.object({
  message: z.string().min(1).max(2000),
});

export const adminProRequestFiltersSchema = z.object({
  status: z.array(z.enum(['new', 'assigned', 'in_progress', 'completed', 'canceled'])).optional(),
  trade: z.enum(['roofing', 'plumbing', 'electrical', 'hvac', 'general']).optional(),
  urgency: z.enum(['emergency', '24h', '3days', 'flexible']).optional(),
  zip: z.string().regex(/^\d{5}$/).optional(),
  providerAssigned: z.string().optional(),
  q: z.string().optional(), // Search query
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
  sortBy: z.enum(['createdAt', 'updatedAt', 'urgency', 'status']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export type AdminProRequestFilters = z.infer<typeof adminProRequestFiltersSchema>;
export type CreateNoteRequest = z.infer<typeof createNoteSchema>;

// =====================================================
// ORDER MAGNET SYSTEM SCHEMAS (E-COMMERCE)
// =====================================================

// Order Magnet System - Using Drizzle table definitions as source of truth

// Drizzle table definitions for Order Magnet System
export const orderMagnetOrdersTable = pgTable("order_magnet_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id", { length: 50 }).unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
  shipAddressLine1: varchar("ship_address_line_1", { length: 255 }).notNull(),
  shipAddressLine2: varchar("ship_address_line_2", { length: 255 }),
  shipCity: varchar("ship_city", { length: 100 }).notNull(),
  shipState: varchar("ship_state", { length: 50 }).notNull(),
  shipZip: varchar("ship_zip", { length: 5 }).notNull(),
  shipCountry: varchar("ship_country", { length: 10 }).notNull().default('US'),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingFee: numeric("shipping_fee", { precision: 10, scale: 2 }).notNull().default('0'),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default('0'),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default('unpaid'),
  paymentProvider: varchar("payment_provider", { length: 20 }).notNull().default('stripe'),
  paymentRef: varchar("payment_ref", { length: 255 }).unique(),
  status: varchar("status", { length: 20 }).notNull().default('new'),
  source: varchar("source", { length: 100 }),
  utmSource: varchar("utm_source", { length: 100 }),
  utmMedium: varchar("utm_medium", { length: 100 }),
  utmCampaign: varchar("utm_campaign", { length: 100 }),
  notes: text("notes"),
});

export const orderMagnetItemsTable = pgTable("order_magnet_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  activationCode: varchar("activation_code", { length: 20 }).notNull().unique(),
  qrUrl: text("qr_url").notNull(),
  activationStatus: varchar("activation_status", { length: 20 }).notNull().default('inactive'),
  activatedAt: timestamp("activated_at"),
  activatedByEmail: varchar("activated_by_email", { length: 255 }),
  householdId: varchar("household_id", { length: 255 }),
  scanCount: integer("scan_count").notNull().default(0),
  lastScanAt: timestamp("last_scan_at"),
  printBatchId: varchar("print_batch_id"),
  serialNumber: varchar("serial_number", { length: 50 }),
  printFileUrl: varchar("print_file_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderMagnetBatchesTable = pgTable("order_magnet_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  printerName: varchar("printer_name", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default('open'),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }),
  quantity: integer("quantity").notNull().default(0),
  submittedAt: timestamp("submitted_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderMagnetShipmentsTable = pgTable("order_magnet_shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  carrier: varchar("carrier", { length: 100 }),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  labelUrl: varchar("label_url", { length: 500 }),
  status: varchar("status", { length: 30 }).notNull().default('pending'),
  shippedAt: timestamp("shipped_at"),
  expectedDelivery: timestamp("expected_delivery"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderMagnetAuditEventsTable = pgTable("order_magnet_audit_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id"),
  itemId: varchar("item_id"),
  createdAt: timestamp("created_at").defaultNow(),
  actor: varchar("actor", { length: 100 }).notNull().default('admin'),
  type: varchar("type", { length: 50 }).notNull(),
  data: jsonb("data").notNull(),
});

// Stripe Events table for webhook idempotency
export const stripeEventsTable = pgTable("stripe_events", {
  eventId: varchar("event_id", { length: 255 }).primaryKey(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
  sessionId: varchar("session_id", { length: 255 }),
  orderId: varchar("order_id", { length: 50 }),
  metadata: jsonb("metadata"),
});

// Households table for PostgreSQL (notification preferences and contact info)
export const householdsTable = pgTable("households", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }), // E.164 format: +14155552671
  
  // Address fields
  addressLine1: varchar("address_line_1", { length: 255 }),
  addressLine2: varchar("address_line_2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipcode: varchar("zipcode", { length: 10 }),
  
  // Notification preferences
  notificationPreference: varchar("notification_preference", { length: 20 }).notNull().default('both'), // 'email_only', 'sms_only', 'both'
  smsOptIn: boolean("sms_opt_in").default(false),
  preferredContact: varchar("preferred_contact", { length: 20 }), // 'email', 'phone', 'text'
  calendarSyncPreference: varchar("calendar_sync_preference", { length: 50 }).default('none'), // 'google', 'apple', 'none'
  
  // Setup tracking
  setupStatus: varchar("setup_status", { length: 20 }).notNull().default('not_started'), // 'not_started', 'in_progress', 'completed'
  setupCompletedAt: timestamp("setup_completed_at"),
  setupStartedAt: timestamp("setup_started_at"),
  setupNotes: text("setup_notes"), // Public setup notes visible to homeowner
  setupIssues: text("setup_issues"), // Setup issues/blockers
  
  // Relationships and audit
  magnetCode: varchar("magnet_code", { length: 50 }), // QR code identifier
  magnetToken: varchar("magnet_token", { length: 50 }), // Activation token (nullable for admin-created)
  orderId: varchar("order_id", { length: 50 }), // Links to order_magnet_orders.order_id
  lastModifiedBy: varchar("last_modified_by"), // UUID of admin user who last edited
  
  // Security and tracking fields
  createdBy: varchar("created_by", { length: 20 }).notNull().default('customer'), // 'customer', 'admin', 'api'
  createdByUserId: varchar("created_by_user_id", { length: 255 }), // UUID of admin who created (if admin-created)
  agentId: varchar("agent_id", { length: 255 }), // Agent who owns this household (nullable for direct orders)
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for search and filtering
  setupStatusIdx: index("idx_households_setup_status").on(table.setupStatus),
  completedDateIdx: index("idx_households_completed_date").on(table.setupCompletedAt),
  orderIdIdx: index("idx_households_order_id").on(table.orderId),
  // Composite index for location filtering
  locationIdx: index("idx_households_location").on(table.state, table.zipcode),
  agentIdIdx: index("idx_households_agent_id").on(table.agentId),
}));

// Setup Form Notes table for admin comments
export const setupFormNotesTable = pgTable("setup_form_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id").notNull(), // Links to households.id
  createdBy: varchar("created_by"), // Email of admin user who created note
  content: text("content").notNull(),
  deletedAt: timestamp("deleted_at"), // Soft delete support
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Index for fetching notes by household (exclude soft-deleted)
  householdIdx: index("idx_setup_notes_household").on(table.householdId),
  authorIdx: index("idx_setup_notes_author").on(table.createdBy),
  createdIdx: index("idx_setup_notes_created").on(table.createdAt),
}));

// Contact Messages table
export const contactMessagesTable = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 160 }).notNull(),
  message: text("message").notNull(),
  sourceIp: varchar("source_ip", { length: 45 }), // IPv6 can be up to 45 chars
  status: varchar("status", { length: 20 }).notNull().default('new'),
  ticketId: varchar("ticket_id", { length: 20 }).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
});

// Drizzle-generated insert schemas and types for Order Magnet system
export const insertOrderMagnetOrderSchema = createInsertSchema(orderMagnetOrdersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrderMagnetOrder = z.infer<typeof insertOrderMagnetOrderSchema>;
export type OrderMagnetOrder = typeof orderMagnetOrdersTable.$inferSelect;

export const insertOrderMagnetItemSchema = createInsertSchema(orderMagnetItemsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrderMagnetItem = z.infer<typeof insertOrderMagnetItemSchema>;
export type OrderMagnetItem = typeof orderMagnetItemsTable.$inferSelect;

export const insertOrderMagnetBatchSchema = createInsertSchema(orderMagnetBatchesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrderMagnetBatch = z.infer<typeof insertOrderMagnetBatchSchema>;
export type OrderMagnetBatch = typeof orderMagnetBatchesTable.$inferSelect;

export const insertOrderMagnetShipmentSchema = createInsertSchema(orderMagnetShipmentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrderMagnetShipment = z.infer<typeof insertOrderMagnetShipmentSchema>;
export type OrderMagnetShipment = typeof orderMagnetShipmentsTable.$inferSelect;

export const insertOrderMagnetAuditEventSchema = createInsertSchema(orderMagnetAuditEventsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOrderMagnetAuditEvent = z.infer<typeof insertOrderMagnetAuditEventSchema>;
export type OrderMagnetAuditEvent = typeof orderMagnetAuditEventsTable.$inferSelect;

// Households schemas and types (PostgreSQL)
export const insertHouseholdDbSchema = createInsertSchema(householdsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertHouseholdDb = z.infer<typeof insertHouseholdDbSchema>;
export type HouseholdDb = typeof householdsTable.$inferSelect;
export type Household = typeof householdsTable.$inferSelect; // Alias for frontend

// Setup Form Notes schemas and types
export const insertSetupFormNoteSchema = createInsertSchema(setupFormNotesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSetupFormNote = z.infer<typeof insertSetupFormNoteSchema>;
export type SetupFormNote = typeof setupFormNotesTable.$inferSelect;

// Contact Message schemas and types
export const insertContactMessageSchema = createInsertSchema(contactMessagesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  ticketId: true, // Generated by API
  sourceIp: true, // Set by API
  status: true, // Defaults to 'new'
});
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessagesTable.$inferSelect;

// Contact form validation schema (for API endpoint)
export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(120, "Name must be 120 characters or less"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Subject is required").max(160, "Subject must be 160 characters or less"),
  message: z.string().min(1, "Message is required").max(5000, "Message must be 5000 characters or less"),
});
export type ContactFormData = z.infer<typeof contactFormSchema>;

// Admin contact message filters
export const adminContactMessageFiltersSchema = z.object({
  status: z.array(z.enum(['new', 'read', 'replied'])).optional(),
  q: z.string().optional(), // Search query
  dateFrom: z.string().optional(), // ISO date string
  dateTo: z.string().optional(), // ISO date string
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
  sortBy: z.enum(['createdAt', 'updatedAt', 'status']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});
export type AdminContactMessageFilters = z.infer<typeof adminContactMessageFiltersSchema>;

// API request schemas for Order Magnet system
export const updateOrderMagnetOrderStatusSchema = z.object({
  status: z.enum(['paid', 'in_production', 'shipped', 'delivered', 'activated', 'canceled', 'refunded']),
  paymentStatus: z.enum(['paid', 'refunded', 'partial_refund']).optional(),
  paymentRef: z.string().optional(),
});

export const updateOrderMagnetShipmentSchema = z.object({
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  labelUrl: z.string().optional(),
  status: z.enum(['label_created', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'lost']),
  shippedAt: z.string().optional(), // ISO date string
  expectedDelivery: z.string().optional(), // ISO date string
  deliveredAt: z.string().optional(), // ISO date string
});

export const createOrderMagnetBatchSchema = z.object({
  name: z.string().min(1),
  printerName: z.string().optional(),
  unitCost: z.number().min(0).optional(),
  notes: z.string().optional(),
  itemIds: z.array(z.string()).optional(), // Items to add to batch
});

export const updateOrderMagnetBatchStatusSchema = z.object({
  status: z.enum(['submitted', 'printing', 'complete', 'canceled']),
  unitCost: z.number().min(0).optional(),
  submittedAt: z.string().optional(), // ISO date string
  completedAt: z.string().optional(), // ISO date string
});

export const activateItemSchema = z.object({
  itemId: z.string().optional(),
  activationEmail: z.string().email().optional(),
});

export const resendEmailSchema = z.object({
  type: z.enum(['confirmation', 'shipped', 'delivered', 'activation_reminder']),
});

export const adminOrderMagnetFiltersSchema = z.object({
  status: z.array(z.enum(['new', 'paid', 'in_production', 'shipped', 'delivered', 'activated', 'canceled', 'refunded'])).optional(),
  paymentStatus: z.array(z.enum(['unpaid', 'paid', 'refunded', 'partial_refund'])).optional(),
  dateFrom: z.string().optional(), // ISO date string
  dateTo: z.string().optional(), // ISO date string
  sku: z.string().optional(),
  zip: z.string().regex(/^\d{5}$/).optional(),
  batchId: z.string().optional(),
  carrier: z.string().optional(),
  activationStatus: z.enum(['inactive', 'activated', 'deactivated']).optional(),
  q: z.string().optional(), // Search query
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
  sortBy: z.enum(['createdAt', 'updatedAt', 'status', 'total']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports for Order Magnet API
export type UpdateOrderMagnetOrderStatusRequest = z.infer<typeof updateOrderMagnetOrderStatusSchema>;
export type UpdateOrderMagnetShipmentRequest = z.infer<typeof updateOrderMagnetShipmentSchema>;
export type CreateOrderMagnetBatchRequest = z.infer<typeof createOrderMagnetBatchSchema>;
export type UpdateOrderMagnetBatchStatusRequest = z.infer<typeof updateOrderMagnetBatchStatusSchema>;
export type ActivateItemRequest = z.infer<typeof activateItemSchema>;
export type ResendEmailRequest = z.infer<typeof resendEmailSchema>;
export type AdminOrderMagnetFilters = z.infer<typeof adminOrderMagnetFiltersSchema>;

// Home Profile Extra Data Table
export const homeProfileExtras = pgTable("home_profile_extras", {
  id: serial("id").primaryKey(),
  householdId: text("household_id").notNull().unique(),
  ownerType: text("owner_type"),
  sellWindow: text("sell_window"),
  
  // Property Details (Phase 1 fields)
  homeType: text("home_type"), // single_family, condo, townhouse, apartment, mobile, other
  yearBuilt: integer("year_built"),
  squareFootage: integer("square_footage"), // House square footage (different from lot)
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  
  // Roof
  roofMaterial: text("roof_material"),
  roofAgeYears: integer("roof_age_years"),
  
  // HVAC
  hvacType: text("hvac_type"),
  hvacAgeYears: integer("hvac_age_years"),
  hvacLastServiceMonth: text("hvac_last_service_month"),
  
  // Water Heater
  waterHeaterType: text("water_heater_type"),
  waterHeaterAgeYears: integer("water_heater_age_years"),
  waterHeaterCapacityGal: integer("water_heater_capacity_gal"),
  
  // Exterior and Lot
  exteriorType: text("exterior_type"),
  lotSqFt: integer("lot_sq_ft"),
  
  // Insurance and Utilities
  insuranceProvider: text("insurance_provider"),
  insuranceRenewalMonth: integer("insurance_renewal_month"),
  electricProvider: text("electric_provider"),
  gasProvider: text("gas_provider"),
  
  // HOA
  hasHoa: boolean("has_hoa").default(false),
  hoaName: text("hoa_name"),
  
  // Planning and Preferences
  plannedProjects: text("planned_projects").array(),
  smartHomeGear: text("smart_home_gear").array(),
  budgetBand: text("budget_band"),
  contactPrefChannel: text("contact_pref_channel"),
  contactPrefCadence: text("contact_pref_cadence"),
  marketingConsent: boolean("marketing_consent").default(true),
  appliances: jsonb("appliances"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type HomeProfileExtra = typeof homeProfileExtras.$inferSelect;
export type InsertHomeProfileExtra = typeof homeProfileExtras.$inferInsert;

// Household Task Assignments Table
export const householdTaskAssignmentsTable = pgTable("household_task_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()::text`),
  householdId: varchar("household_id").notNull(),
  taskId: integer("task_id").notNull(),
  
  // Scheduling
  dueDate: timestamp("due_date", { mode: 'date' }).notNull(),
  frequency: varchar("frequency", { length: 50 }),
  
  // Status tracking
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  completedAt: timestamp("completed_at"),
  skippedAt: timestamp("skipped_at"),
  skippedReason: text("skipped_reason"),
  
  // Additional info
  priority: varchar("priority", { length: 20 }).default('medium'),
  notes: text("notes"),
  reminderSent: boolean("reminder_sent").default(false),
  reminderSentAt: timestamp("reminder_sent_at"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  householdIdx: index("idx_household_task_assignments_household").on(table.householdId),
  dueDateIdx: index("idx_household_task_assignments_due_date").on(table.dueDate),
  statusIdx: index("idx_household_task_assignments_status").on(table.status),
  taskIdx: index("idx_household_task_assignments_task").on(table.taskId),
  householdStatusIdx: index("idx_household_task_assignments_household_status").on(table.householdId, table.status),
  householdDueIdx: index("idx_household_task_assignments_household_due").on(table.householdId, table.dueDate),
}));

export type HouseholdTaskAssignment = typeof householdTaskAssignmentsTable.$inferSelect;
export type InsertHouseholdTaskAssignment = typeof householdTaskAssignmentsTable.$inferInsert;

// Admin Setup Forms API Schemas
export const adminSetupFormFiltersSchema = z.object({
  status: z.string().optional(), // 'not_started', 'in_progress', 'completed'
  city: z.string().optional(),
  state: z.string().optional(), // Two-letter state code
  zipcode: z.string().optional(), // 5 or 9-digit ZIP
  q: z.string().optional(), // Search query (name, email, address)
  dateFrom: z.string().optional(), // ISO date string for setup_completed_at
  dateTo: z.string().optional(), // ISO date string for setup_completed_at
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
  sortBy: z.enum(['name', 'setupCompletedAt', 'createdAt', 'city', 'zipcode']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});
export type AdminSetupFormFilters = z.infer<typeof adminSetupFormFiltersSchema>;

export const updateSetupFormSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(30).optional(), // E.164 format
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2).optional(),
  zipcode: z.string().max(10).optional(),
  notificationPreference: z.enum(['email_only', 'sms_only', 'both']).optional(),
  smsOptIn: z.boolean().optional(),
  preferredContact: z.string().max(20).optional(),
  setupStatus: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  setupNotes: z.string().max(10000).optional(),
  setupIssues: z.string().max(10000).optional(),
  magnetCode: z.string().max(50).optional(),
  orderId: z.string().max(50).optional(),
});
export type UpdateSetupFormData = z.infer<typeof updateSetupFormSchema>;

export const createSetupFormNoteSchema = z.object({
  content: z.string().min(1, "Note content is required").max(10000, "Note must be 10,000 characters or less"),
});
export type CreateSetupFormNoteData = z.infer<typeof createSetupFormNoteSchema>;

export const testNotificationSchema = z.object({
  channel: z.enum(['email', 'sms', 'both']),
});
export type TestNotificationData = z.infer<typeof testNotificationSchema>;

// Calendar Connections Table
export const calendarConnectionsTable = pgTable('calendar_connections', {
  id: text('id').primaryKey(),
  household_id: text('household_id').notNull().references(() => householdsTable.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 20 }).notNull(),
  access_token: text('access_token').notNull(),
  refresh_token: text('refresh_token').notNull(),
  token_expiry: timestamp('token_expiry'),
  calendar_id: text('calendar_id').notNull(),
  calendar_name: text('calendar_name'),
  calendar_timezone: text('calendar_timezone').notNull().default('America/New_York'),
  sync_enabled: boolean('sync_enabled').notNull().default(true),
  last_sync: timestamp('last_sync'),
  last_sync_status: varchar('last_sync_status', { length: 20 }),
  last_sync_error: text('last_sync_error'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Calendar Sync Events Table
export const calendarSyncEventsTable = pgTable('calendar_sync_events', {
  id: text('id').primaryKey(),
  connection_id: text('connection_id').notNull().references(() => calendarConnectionsTable.id, { onDelete: 'cascade' }),
  household_id: text('household_id').notNull().references(() => householdsTable.id, { onDelete: 'cascade' }),
  task_id: text('task_id'),
  task_title: text('task_title').notNull(),
  google_event_id: text('google_event_id').notNull().unique(),
  event_start: timestamp('event_start').notNull(),
  event_end: timestamp('event_end').notNull(),
  event_status: varchar('event_status', { length: 20 }).notNull(),
  sync_status: varchar('sync_status', { length: 20 }).notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// =====================================================
// APPLIANCE TRACKING & MAINTENANCE LOG SYSTEM
// =====================================================

// Common Appliances Table - Master list of common appliances
export const commonAppliancesTable = pgTable('common_appliances', {
  id: serial('id').primaryKey(),
  applianceType: varchar('appliance_type', { length: 100 }).notNull().unique(),
  category: varchar('category', { length: 50 }).notNull(),
  typicalLifespanYears: integer('typical_lifespan_years'),
  commonBrands: text('common_brands').array(),
  maintenanceNotes: text('maintenance_notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type CommonAppliance = typeof commonAppliancesTable.$inferSelect;
export type InsertCommonAppliance = typeof commonAppliancesTable.$inferInsert;

// Household Appliances Table - Track appliances for each household
export const householdAppliancesTable = pgTable('household_appliances', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar('household_id').notNull().references(() => householdsTable.id, { onDelete: 'cascade' }),
  
  applianceType: varchar('appliance_type', { length: 100 }).notNull(),
  brand: varchar('brand', { length: 100 }).notNull(),
  modelNumber: varchar('model_number', { length: 100 }).notNull(),
  serialNumber: varchar('serial_number', { length: 100 }).notNull().unique(),
  purchaseDate: timestamp('purchase_date', { mode: 'date' }).notNull(),
  
  purchasePrice: numeric('purchase_price', { precision: 10, scale: 2 }),
  installationDate: timestamp('installation_date', { mode: 'date' }),
  location: varchar('location', { length: 200 }),
  notes: text('notes'),
  
  warrantyType: varchar('warranty_type', { length: 50 }),
  warrantyExpiration: timestamp('warranty_expiration', { mode: 'date' }),
  warrantyProvider: varchar('warranty_provider', { length: 100 }),
  warrantyPolicyNumber: varchar('warranty_policy_number', { length: 100 }),
  warrantyCoverageDetails: text('warranty_coverage_details'),
  
  warrantyAlertSent: boolean('warranty_alert_sent').default(false),
  warrantyAlertSentAt: timestamp('warranty_alert_sent_at'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: varchar('created_by', { length: 50 }),
  createdByUserId: varchar('created_by_user_id', { length: 255 }),
}, (table) => ({
  householdIdx: index('idx_household_appliances_household').on(table.householdId),
  typeIdx: index('idx_household_appliances_type').on(table.applianceType),
  warrantyExpIdx: index('idx_household_appliances_warranty_exp').on(table.warrantyExpiration),
  activeIdx: index('idx_household_appliances_active').on(table.isActive),
}));

export type HouseholdAppliance = typeof householdAppliancesTable.$inferSelect;
export type InsertHouseholdAppliance = typeof householdAppliancesTable.$inferInsert;

// Maintenance Logs Table - Record all maintenance activities
export const maintenanceLogsTable = pgTable('maintenance_logs', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar('household_id').notNull().references(() => householdsTable.id, { onDelete: 'cascade' }),
  taskAssignmentId: varchar('task_assignment_id').references(() => householdTaskAssignmentsTable.id, { onDelete: 'set null' }),
  applianceId: varchar('appliance_id').references(() => householdAppliancesTable.id, { onDelete: 'set null' }),
  
  maintenanceDate: timestamp('maintenance_date', { mode: 'date' }).notNull(),
  taskPerformed: text('task_performed').notNull(),
  logType: varchar('log_type', { length: 20 }).notNull(),
  
  cost: numeric('cost', { precision: 10, scale: 2 }),
  serviceProvider: varchar('service_provider', { length: 200 }),
  partsReplaced: text('parts_replaced'),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: varchar('created_by', { length: 50 }),
  createdByUserId: varchar('created_by_user_id', { length: 255 }),
  
  wasOnTime: boolean('was_on_time'),
  daysLate: integer('days_late'),
}, (table) => ({
  householdIdx: index('idx_maintenance_logs_household').on(table.householdId),
  applianceIdx: index('idx_maintenance_logs_appliance').on(table.applianceId),
  taskIdx: index('idx_maintenance_logs_task').on(table.taskAssignmentId),
  dateIdx: index('idx_maintenance_logs_date').on(table.maintenanceDate),
  typeIdx: index('idx_maintenance_logs_type').on(table.logType),
}));

export type MaintenanceLog = typeof maintenanceLogsTable.$inferSelect;
export type InsertMaintenanceLog = typeof maintenanceLogsTable.$inferInsert;

// Zod schemas for validation
export const insertHouseholdApplianceSchema = z.object({
  householdId: z.string().optional(),
  applianceType: z.string().min(1, "Appliance type is required"),
  brand: z.string().min(1, "Brand is required"),
  modelNumber: z.string().min(1, "Model number is required"),
  serialNumber: z.string().min(1, "Serial number is required"),
  purchaseDate: z.string().or(z.date()),
  purchasePrice: z.string().or(z.number()).optional(),
  installationDate: z.string().or(z.date()).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  warrantyType: z.enum(['Manufacturer', 'Extended', 'Labor']).optional(),
  warrantyExpiration: z.string().or(z.date()).optional(),
  warrantyProvider: z.string().optional(),
  warrantyPolicyNumber: z.string().optional(),
  warrantyCoverageDetails: z.string().optional(),
});

export const updateHouseholdApplianceSchema = insertHouseholdApplianceSchema.partial();

export const insertMaintenanceLogSchema = z.object({
  householdId: z.string().optional(),
  taskAssignmentId: z.string().optional(),
  applianceId: z.string().optional(),
  maintenanceDate: z.string().or(z.date()),
  taskPerformed: z.string().min(1, "Task performed is required"),
  logType: z.enum(['scheduled', 'manual', 'emergency']),
  cost: z.string().or(z.number()).optional(),
  serviceProvider: z.string().optional(),
  partsReplaced: z.string().optional(),
  notes: z.string().optional(),
});

export const updateMaintenanceLogSchema = insertMaintenanceLogSchema.partial();

export const maintenanceLogFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  applianceId: z.string().optional(),
  logType: z.enum(['scheduled', 'manual', 'emergency']).optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
  sortBy: z.enum(['maintenanceDate', 'createdAt', 'cost']).default('maintenanceDate'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export type MaintenanceLogFilters = z.infer<typeof maintenanceLogFiltersSchema>;

// ============================================================================
// Firebase Migration Phase 2A - New Tables
// ============================================================================

// Leads Table - Replaces Firebase 'leads' collection
export const leadsTable = pgTable("leads", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name"),
  email: text("email"),
  phone: text("phone"),
  preferredContact: text("preferred_contact"),
  hearAboutUs: text("hear_about_us"),
  streetAddress: text("street_address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  propertyType: text("property_type"),
  numberOfLocations: integer("number_of_locations"),
  locationNickname: text("location_nickname"),
  homeType: text("home_type"),
  squareFootage: integer("square_footage"),
  roofAge: integer("roof_age"),
  hvacSystemType: text("hvac_system_type"),
  waterHeaterType: text("water_heater_type"),
  numberOfAssets: integer("number_of_assets"),
  assetCategories: text("asset_categories"),
  companyName: text("company_name"),
  industryType: text("industry_type"),
  numberOfEmployees: integer("number_of_employees"),
  businessWebsite: text("business_website"),
  preferredServiceType: text("preferred_service_type"),
  estimatedQrLabels: text("estimated_qr_labels"),
  interestType: text("interest_type"),
  needConsultation: boolean("need_consultation"),
  isOwner: boolean("is_owner"),
  budgetRange: text("budget_range"),
  timelineToProceed: text("timeline_to_proceed"),
  preferredContactTime: text("preferred_contact_time"),
  notes: text("notes"),
  activationCode: text("activation_code"),
  agentId: text("agent_id"),
  status: text("status").default('new'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
  agentIdx: index("idx_leads_agent").on(table.agentId),
  statusIdx: index("idx_leads_status").on(table.status),
  createdIdx: index("idx_leads_created").on(table.createdAt)
}));

export type LeadDb = typeof leadsTable.$inferSelect;
export type InsertLeadDb = typeof leadsTable.$inferInsert;

// Agents Table - Replaces Firebase 'agents' collection
export const agentsTable = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  status: varchar("status", { length: 50 }).default('active'),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const agentsRelations = relations(agentsTable, ({ many }) => ({
  batches: many(orderMagnetBatchesTable),
  households: many(householdsTable)
}));

export type Agent = typeof agentsTable.$inferSelect;
export type InsertAgent = typeof agentsTable.$inferInsert;

// Schedules Table - Replaces Firebase 'schedules' collection
export const schedulesTable = pgTable("schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id", { length: 255 }).notNull().references(() => householdsTable.id),
  taskName: varchar("task_name", { length: 255 }).notNull(),
  frequency: varchar("frequency", { length: 50 }),
  nextDueDate: date("next_due_date"),
  lastCompletedDate: date("last_completed_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  householdIdx: index("idx_schedules_household").on(table.householdId),
  taskIdx: index("idx_schedules_task").on(table.taskName),
  uniqueHouseholdTask: uniqueIndex("idx_schedules_household_task").on(table.householdId, table.taskName)
}));

export type Schedule = typeof schedulesTable.$inferSelect;
export type InsertSchedule = typeof schedulesTable.$inferInsert;

// Task Completions Table - Replaces Firebase 'taskCompletions' collection
export const taskCompletionsTable = pgTable("task_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id", { length: 255 }).notNull().references(() => householdsTable.id),
  taskId: integer("task_id").references(() => homeMaintenanceTasksTable.id),
  scheduleId: varchar("schedule_id", { length: 255 }).references(() => schedulesTable.id),
  completedAt: timestamp("completed_at").notNull(),
  completedBy: varchar("completed_by", { length: 255 }),
  notes: text("notes"),
  cost: numeric("cost", { precision: 10, scale: 2 }),
  serviceProvider: varchar("service_provider", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  householdIdx: index("idx_task_completions_household").on(table.householdId),
  completedIdx: index("idx_task_completions_completed").on(table.completedAt)
}));

export type TaskCompletion = typeof taskCompletionsTable.$inferSelect;
export type InsertTaskCompletion = typeof taskCompletionsTable.$inferInsert;

// Reminder Queue Table - Replaces Firebase 'reminderQueue' collection
export const reminderQueueTable = pgTable("reminder_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id", { length: 255 }).notNull().references(() => householdsTable.id),
  taskId: varchar("task_id", { length: 255 }),
  taskName: varchar("task_name", { length: 255 }).notNull(),
  taskDescription: text("task_description"),
  dueDate: date("due_date").notNull(),
  runAt: timestamp("run_at").notNull(),
  method: varchar("method", { length: 50 }).default('email'),
  status: varchar("status", { length: 50 }).default('pending'),
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  statusIdx: index("idx_reminder_queue_status").on(table.status),
  runAtIdx: index("idx_reminder_queue_run_at").on(table.runAt),
  householdIdx: index("idx_reminder_queue_household").on(table.householdId)
}));

export type ReminderQueue = typeof reminderQueueTable.$inferSelect;
export type InsertReminderQueue = typeof reminderQueueTable.$inferInsert;

// Magic Links Table - For passwordless authentication
export const magicLinksTable = pgTable("magic_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: varchar("token", { length: 64 }).unique().notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  householdId: varchar("household_id", { length: 255 }).references(() => householdsTable.id),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  tokenIdx: uniqueIndex("idx_magic_links_token").on(table.token),
  emailIdx: index("idx_magic_links_email").on(table.email),
  expiresIdx: index("idx_magic_links_expires").on(table.expiresAt)
}));

export type MagicLink = typeof magicLinksTable.$inferSelect;
export type InsertMagicLink = typeof magicLinksTable.$inferInsert;

// Sessions Table - For dashboard access after magic link verification
export const sessionsTable = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: varchar("token", { length: 64 }).unique().notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  householdId: varchar("household_id", { length: 255 }).references(() => householdsTable.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  sessionTokenIdx: uniqueIndex("idx_sessions_token").on(table.token),
  sessionEmailIdx: index("idx_sessions_email").on(table.email),
  sessionExpiresIdx: index("idx_sessions_expires").on(table.expiresAt)
}));

export type Session = typeof sessionsTable.$inferSelect;
export type InsertSession = typeof sessionsTable.$inferInsert;

// Warranty Notifications Table - Track sent warranty expiration alerts
export const warrantyNotificationsTable = pgTable("warranty_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdApplianceId: varchar("household_appliance_id", { length: 255 }).notNull().references(() => householdAppliancesTable.id, { onDelete: 'cascade' }),
  householdId: varchar("household_id", { length: 255 }).notNull().references(() => householdsTable.id, { onDelete: 'cascade' }),
  notificationType: varchar("notification_type", { length: 20 }).notNull(), // '7_day', '3_day'
  notificationMethod: varchar("notification_method", { length: 20 }).notNull(), // 'email_only', 'sms_only', 'both'
  emailSent: boolean("email_sent").default(false),
  smsSent: boolean("sms_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  smsSentAt: timestamp("sms_sent_at"),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // 'pending', 'sent', 'partial', 'failed'
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  applianceIdx: index("idx_warranty_notif_appliance").on(table.householdApplianceId),
  householdIdx: index("idx_warranty_notif_household").on(table.householdId),
  typeIdx: index("idx_warranty_notif_type").on(table.notificationType),
  statusIdx: index("idx_warranty_notif_status").on(table.status),
  uniqueNotification: uniqueIndex("idx_warranty_notif_unique").on(table.householdApplianceId, table.notificationType)
}));

export type WarrantyNotification = typeof warrantyNotificationsTable.$inferSelect;
export type InsertWarrantyNotification = typeof warrantyNotificationsTable.$inferInsert;

// Lead Capture
export * from "./lead-schema";
