import { type User, type InsertUser, type Batch, type InsertBatch, type Magnet, type Household, type Schedule, type Event, type Reminder } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  createMagnet(magnet: { batchId: string; token: string; url: string }): Promise<Magnet>;
  getMagnetsByBatchId(batchId: string): Promise<Magnet[]>;
  getMagnetById(id: string): Promise<Magnet | undefined>;
  getMagnetByToken(token: string): Promise<Magnet | undefined>;
  getHouseholdByToken(token: string): Promise<Household | undefined>;
  createHousehold(household: { token: string; zip: string; homeType: string; sqft?: number; hvacType?: string; waterHeater?: string; roofAgeYears?: number; email?: string; activatedAt?: Date }): Promise<Household>;
  updateHousehold(id: string, updates: Partial<Household>): Promise<Household | undefined>;
  createSchedule(schedule: { householdId: string; taskName: string; description?: string; frequencyMonths: number; climateZone: string; priority?: number }): Promise<Schedule>;
  getSchedulesByHouseholdId(householdId: string): Promise<Schedule[]>;
  createEvent(event: { householdId: string; eventType: string; eventData?: string }): Promise<Event>;
  createReminder(reminder: { householdId: string; scheduleId?: string; taskName: string; dueDate: Date }): Promise<Reminder>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private batches: Map<string, Batch>;
  private magnets: Map<string, Magnet>;
  private households: Map<string, Household>;
  private schedules: Map<string, Schedule>;
  private events: Map<string, Event>;
  private reminders: Map<string, Reminder>;

  constructor() {
    this.users = new Map();
    this.batches = new Map();
    this.magnets = new Map();
    this.households = new Map();
    this.schedules = new Map();
    this.events = new Map();
    this.reminders = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createBatch(insertBatch: InsertBatch): Promise<Batch> {
    const id = randomUUID();
    const batch: Batch = { 
      ...insertBatch, 
      id, 
      createdAt: new Date() 
    };
    this.batches.set(id, batch);
    return batch;
  }

  async createMagnet(magnetData: { batchId: string; token: string; url: string }): Promise<Magnet> {
    const id = randomUUID();
    const magnet: Magnet = {
      id,
      batchId: magnetData.batchId,
      token: magnetData.token,
      url: magnetData.url,
      createdAt: new Date()
    };
    this.magnets.set(id, magnet);
    return magnet;
  }

  async getMagnetsByBatchId(batchId: string): Promise<Magnet[]> {
    return Array.from(this.magnets.values()).filter(
      (magnet) => magnet.batchId === batchId
    );
  }

  async getMagnetById(id: string): Promise<Magnet | undefined> {
    return this.magnets.get(id);
  }

  async getMagnetByToken(token: string): Promise<Magnet | undefined> {
    return Array.from(this.magnets.values()).find(
      (magnet) => magnet.token === token
    );
  }

  async getHouseholdByToken(token: string): Promise<Household | undefined> {
    return Array.from(this.households.values()).find(
      (household) => household.token === token
    );
  }

  async createHousehold(householdData: { token: string; zip: string; homeType: string; sqft?: number; hvacType?: string; waterHeater?: string; roofAgeYears?: number; email?: string; activatedAt?: Date }): Promise<Household> {
    const id = randomUUID();
    const household: Household = {
      id,
      token: householdData.token,
      zip: householdData.zip,
      homeType: householdData.homeType,
      sqft: householdData.sqft || null,
      hvacType: householdData.hvacType || null,
      waterHeater: householdData.waterHeater || null,
      roofAgeYears: householdData.roofAgeYears || null,
      email: householdData.email || null,
      activatedAt: householdData.activatedAt || null,
      createdAt: new Date()
    };
    this.households.set(id, household);
    return household;
  }

  async updateHousehold(id: string, updates: Partial<Household>): Promise<Household | undefined> {
    const existing = this.households.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.households.set(id, updated);
    return updated;
  }

  async createSchedule(scheduleData: { householdId: string; taskName: string; description?: string; frequencyMonths: number; climateZone: string; priority?: number }): Promise<Schedule> {
    const id = randomUUID();
    const schedule: Schedule = {
      id,
      householdId: scheduleData.householdId,
      taskName: scheduleData.taskName,
      description: scheduleData.description || null,
      frequencyMonths: scheduleData.frequencyMonths,
      climateZone: scheduleData.climateZone,
      priority: scheduleData.priority || 1,
      isActive: true,
      createdAt: new Date()
    };
    this.schedules.set(id, schedule);
    return schedule;
  }

  async getSchedulesByHouseholdId(householdId: string): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(
      (schedule) => schedule.householdId === householdId && schedule.isActive
    );
  }

  async createEvent(eventData: { householdId: string; eventType: string; eventData?: string }): Promise<Event> {
    const id = randomUUID();
    const event: Event = {
      id,
      householdId: eventData.householdId,
      eventType: eventData.eventType,
      eventData: eventData.eventData || null,
      createdAt: new Date()
    };
    this.events.set(id, event);
    return event;
  }

  async createReminder(reminderData: { householdId: string; scheduleId?: string; taskName: string; dueDate: Date }): Promise<Reminder> {
    const id = randomUUID();
    const reminder: Reminder = {
      id,
      householdId: reminderData.householdId,
      scheduleId: reminderData.scheduleId || null,
      taskName: reminderData.taskName,
      dueDate: reminderData.dueDate,
      isCompleted: false,
      createdAt: new Date()
    };
    this.reminders.set(id, reminder);
    return reminder;
  }
}

export const storage = new MemStorage();
