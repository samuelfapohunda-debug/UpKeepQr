import { z } from "zod";
import { pgTable, serial, varchar, text, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
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
  activatedAt: z.date().optional(),
  lastReminder: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Household = z.infer<typeof householdSchema>;
export type InsertHousehold = z.infer<typeof householdSchema>;

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
  token: z.string().min(1),
  zip: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
  home_type: z.string().min(1),
  sqft: z.number().positive().optional(),
  hvac_type: z.string().optional(),
  water_heater: z.string().optional(),
  roof_age_years: z.number().min(0).max(100).optional(),
  email: z.string().email().optional(),
});

export const setupPreviewSchema = z.object({
  zip: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
  home_type: z.string().min(1),
  sqft: z.number().positive().optional(),
  hvac_type: z.string().optional(),
  water_heater: z.string().optional(),
  roof_age_years: z.number().min(0).max(100).optional(),
});

export const taskCompleteSchema = z.object({
  householdToken: z.string().min(1),
  task_code: z.string().min(1),
});

export const agentLoginSchema = z.object({
  email: z.string().email(),
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
export const insertHomeMaintenanceTaskSchema = createInsertSchema(homeMaintenanceTasksTable);
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