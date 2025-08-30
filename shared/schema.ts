import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const batches = pgTable("batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: text("agent_id").notNull(),
  qty: integer("qty").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const magnets = pgTable("magnets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  batchId: varchar("batch_id").notNull().references(() => batches.id),
  token: text("token").notNull().unique(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const households = pgTable("households", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull().unique().references(() => magnets.token),
  zip: text("zip").notNull(),
  homeType: text("home_type").notNull(),
  sqft: integer("sqft"),
  hvacType: text("hvac_type"),
  waterHeater: text("water_heater"),
  roofAgeYears: integer("roof_age_years"),
  email: text("email"),
  activatedAt: timestamp("activated_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const schedules = pgTable("schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id").notNull().references(() => households.id),
  taskName: text("task_name").notNull(),
  description: text("description"),
  frequencyMonths: integer("frequency_months").notNull(),
  climateZone: text("climate_zone").notNull(),
  priority: integer("priority").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id").notNull().references(() => households.id),
  eventType: text("event_type").notNull(),
  eventData: text("event_data"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const reminders = pgTable("reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id").notNull().references(() => households.id),
  scheduleId: varchar("schedule_id").references(() => schedules.id),
  taskName: text("task_name").notNull(),
  dueDate: timestamp("due_date").notNull(),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const reminderQueue = pgTable("reminder_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id").notNull().references(() => households.id),
  scheduleId: varchar("schedule_id").references(() => schedules.id),
  taskName: text("task_name").notNull(),
  taskDescription: text("task_description"),
  dueDate: timestamp("due_date").notNull(),
  runAt: timestamp("run_at").notNull(), // When to send the reminder (due_date - 7 days)
  status: text("status").notNull().default("pending"), // pending, sent, failed
  reminderType: text("reminder_type").notNull().default("email"), // email, sms, etc.
  message: text("message"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const taskCompletions = pgTable("task_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  householdId: varchar("household_id").notNull().references(() => households.id),
  scheduleId: varchar("schedule_id").notNull().references(() => schedules.id),
  taskCode: text("task_code").notNull(),
  completedAt: timestamp("completed_at").notNull(),
  nextDueDate: timestamp("next_due_date").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBatchSchema = createInsertSchema(batches).pick({
  agentId: true,
  qty: true,
});

export const insertHouseholdSchema = createInsertSchema(households).pick({
  token: true,
  zip: true,
  homeType: true,
  sqft: true,
  hvacType: true,
  waterHeater: true,
  roofAgeYears: true,
  email: true,
});

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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type Batch = typeof batches.$inferSelect;
export type Magnet = typeof magnets.$inferSelect;
export type Household = typeof households.$inferSelect;
export type InsertHousehold = z.infer<typeof insertHouseholdSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type ReminderQueue = typeof reminderQueue.$inferSelect;
export type TaskCompletion = typeof taskCompletions.$inferSelect;
export type SetupActivateRequest = z.infer<typeof setupActivateSchema>;
export type SetupPreviewRequest = z.infer<typeof setupPreviewSchema>;
export type TaskCompleteRequest = z.infer<typeof taskCompleteSchema>;
