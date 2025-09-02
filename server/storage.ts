import { type User, type InsertUser, type Batch, type InsertBatch, type Magnet, type Household, type Schedule, type Event, type Reminder, type ReminderQueue, type TaskCompletion, type Lead, type InsertLead, type Audit, type InsertAudit } from "@shared/schema";
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
  getHouseholdById(id: string): Promise<Household | undefined>;
  createHousehold(household: { token: string; zip: string; homeType: string; sqft?: number; hvacType?: string; waterHeater?: string; roofAgeYears?: number; email?: string; activatedAt?: Date }): Promise<Household>;
  updateHousehold(id: string, updates: Partial<Household>): Promise<Household | undefined>;
  createSchedule(schedule: { householdId: string; taskName: string; description?: string; frequencyMonths: number; climateZone: string; priority?: number }): Promise<Schedule>;
  getSchedulesByHouseholdId(householdId: string): Promise<Schedule[]>;
  getScheduleByHouseholdAndTask(householdId: string, taskCode: string): Promise<Schedule | undefined>;
  createEvent(event: { householdId: string; eventType: string; eventData?: string }): Promise<Event>;
  createReminder(reminder: { householdId: string; scheduleId?: string; taskName: string; dueDate: Date }): Promise<Reminder>;
  createReminderQueue(reminder: { householdId: string; scheduleId?: string; taskName: string; taskDescription?: string; dueDate: Date; runAt: Date; reminderType?: string; message?: string }): Promise<ReminderQueue>;
  getPendingReminders(beforeDate: Date): Promise<ReminderQueue[]>;
  updateReminderStatus(id: string, status: string): Promise<void>;
  createTaskCompletion(completion: { householdId: string; scheduleId: string; taskCode: string; completedAt: Date; nextDueDate: Date }): Promise<TaskCompletion>;
  // Agent methods
  getBatchesByAgentId(agentId: string): Promise<Batch[]>;
  getBatchById(id: string): Promise<Batch | undefined>;
  getActivatedHouseholdsByAgentId(agentId: string): Promise<(Household & { lastReminder?: Date | null; city?: string })[]>;
  getAgentMetrics(agentId: string): Promise<{
    totalMagnets: number;
    scans: number;
    activations: number;
    last30DayActive: number;
  }>;
  // Leads methods
  createLead(lead: { householdId: string; service: string; notes?: string }): Promise<Lead>;
  getLeadsByHouseholdId(householdId: string): Promise<Lead[]>;
  // Audit methods
  createAuditLog(audit: { actor: string; action: string; meta?: any }): Promise<Audit>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private batches: Map<string, Batch>;
  private magnets: Map<string, Magnet>;
  private households: Map<string, Household>;
  private schedules: Map<string, Schedule>;
  private events: Map<string, Event>;
  private reminders: Map<string, Reminder>;
  private reminderQueue: Map<string, ReminderQueue>;
  private taskCompletions: Map<string, TaskCompletion>;
  private leads: Map<string, Lead>;
  private auditLogs: Map<string, Audit>;

  constructor() {
    this.users = new Map();
    this.batches = new Map();
    this.magnets = new Map();
    this.households = new Map();
    this.schedules = new Map();
    this.events = new Map();
    this.reminders = new Map();
    this.reminderQueue = new Map();
    this.taskCompletions = new Map();
    this.leads = new Map();
    this.auditLogs = new Map();
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
      phone: null,
      smsOptIn: false,
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

  async getHouseholdById(id: string): Promise<Household | undefined> {
    return this.households.get(id);
  }

  async getScheduleByHouseholdAndTask(householdId: string, taskCode: string): Promise<Schedule | undefined> {
    return Array.from(this.schedules.values()).find(
      (schedule) => schedule.householdId === householdId && 
      schedule.taskName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '') === taskCode
    );
  }

  async createReminderQueue(reminderData: { 
    householdId: string; 
    scheduleId?: string; 
    taskName: string; 
    taskDescription?: string; 
    dueDate: Date; 
    runAt: Date; 
    reminderType?: string; 
    message?: string 
  }): Promise<ReminderQueue> {
    const id = randomUUID();
    const reminder: ReminderQueue = {
      id,
      householdId: reminderData.householdId,
      scheduleId: reminderData.scheduleId || null,
      taskName: reminderData.taskName,
      taskDescription: reminderData.taskDescription || null,
      dueDate: reminderData.dueDate,
      runAt: reminderData.runAt,
      status: 'pending',
      reminderType: reminderData.reminderType || 'email',
      message: reminderData.message || null,
      sentAt: null,
      createdAt: new Date()
    };
    this.reminderQueue.set(id, reminder);
    return reminder;
  }

  async getPendingReminders(beforeDate: Date): Promise<ReminderQueue[]> {
    return Array.from(this.reminderQueue.values()).filter(
      (reminder) => reminder.status === 'pending' && reminder.runAt <= beforeDate
    );
  }

  async updateReminderStatus(id: string, status: string): Promise<void> {
    const reminder = this.reminderQueue.get(id);
    if (reminder) {
      reminder.status = status;
      if (status === 'sent') {
        reminder.sentAt = new Date();
      }
      this.reminderQueue.set(id, reminder);
    }
  }

  async createTaskCompletion(completionData: { 
    householdId: string; 
    scheduleId: string; 
    taskCode: string; 
    completedAt: Date; 
    nextDueDate: Date 
  }): Promise<TaskCompletion> {
    const id = randomUUID();
    const completion: TaskCompletion = {
      id,
      householdId: completionData.householdId,
      scheduleId: completionData.scheduleId,
      taskCode: completionData.taskCode,
      completedAt: completionData.completedAt,
      nextDueDate: completionData.nextDueDate,
      createdAt: new Date()
    };
    this.taskCompletions.set(id, completion);
    return completion;
  }

  async getBatchesByAgentId(agentId: string): Promise<Batch[]> {
    return Array.from(this.batches.values()).filter(
      (batch) => batch.agentId === agentId
    );
  }

  async getBatchById(id: string): Promise<Batch | undefined> {
    return this.batches.get(id);
  }

  async getActivatedHouseholdsByAgentId(agentId: string): Promise<(Household & { lastReminder?: Date | null; city?: string })[]> {
    // Get all batches for this agent
    const agentBatches = await this.getBatchesByAgentId(agentId);
    const agentBatchIds = agentBatches.map(b => b.id);
    
    // Get all magnets from these batches
    const agentMagnets = Array.from(this.magnets.values()).filter(
      (magnet) => agentBatchIds.includes(magnet.batchId)
    );
    const agentTokens = agentMagnets.map(m => m.token);
    
    // Get activated households using these tokens
    const households = Array.from(this.households.values()).filter(
      (household) => household.activatedAt && agentTokens.includes(household.token)
    );

    // Add last reminder date and mock city for each household
    return households.map(household => {
      // Find the most recent reminder for this household
      const householdReminders = Array.from(this.reminderQueue.values()).filter(
        r => r.householdId === household.id && r.sentAt
      );
      const lastReminder = householdReminders.length > 0 
        ? householdReminders.sort((a, b) => (b.sentAt?.getTime() || 0) - (a.sentAt?.getTime() || 0))[0].sentAt 
        : null;

      // Mock city based on ZIP (simple mapping for demo)
      const cityMap: { [key: string]: string } = {
        '10001': 'New York',
        '90210': 'Beverly Hills',
        '02101': 'Boston',
        '60601': 'Chicago',
        '33101': 'Miami'
      };
      const city = cityMap[household.zip] || 'Unknown City';

      return {
        ...household,
        lastReminder,
        city
      };
    });
  }

  async getAgentMetrics(agentId: string): Promise<{
    totalMagnets: number;
    scans: number;
    activations: number;
    last30DayActive: number;
  }> {
    // Get all batches for this agent
    const agentBatches = await this.getBatchesByAgentId(agentId);
    const agentBatchIds = agentBatches.map(b => b.id);
    
    // Count total magnets
    const totalMagnets = Array.from(this.magnets.values()).filter(
      (magnet) => agentBatchIds.includes(magnet.batchId)
    ).length;

    // Get agent tokens
    const agentMagnets = Array.from(this.magnets.values()).filter(
      (magnet) => agentBatchIds.includes(magnet.batchId)
    );
    const agentTokens = agentMagnets.map(m => m.token);

    // Count households that accessed setup (scans)
    const scans = Array.from(this.households.values()).filter(
      (household) => agentTokens.includes(household.token)
    ).length;

    // Count activated households
    const activations = Array.from(this.households.values()).filter(
      (household) => household.activatedAt && agentTokens.includes(household.token)
    ).length;

    // Count households active in last 30 days (with events)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activatedHouseholds = Array.from(this.households.values()).filter(
      (household) => household.activatedAt && agentTokens.includes(household.token)
    );
    const activeHouseholdIds = activatedHouseholds.map(h => h.id);
    
    const last30DayActive = Array.from(this.events.values()).filter(
      (event) => activeHouseholdIds.includes(event.householdId) && 
                 event.createdAt >= thirtyDaysAgo
    ).map(e => e.householdId).filter((id, index, arr) => arr.indexOf(id) === index).length;

    return {
      totalMagnets,
      scans,
      activations,
      last30DayActive
    };
  }

  async createLead(leadData: { householdId: string; service: string; notes?: string }): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = {
      id,
      householdId: leadData.householdId,
      service: leadData.service,
      status: 'pending',
      notes: leadData.notes || null,
      createdAt: new Date()
    };
    this.leads.set(id, lead);
    return lead;
  }

  async getLeadsByHouseholdId(householdId: string): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(
      (lead) => lead.householdId === householdId
    );
  }

  async createAuditLog(auditData: { actor: string; action: string; meta?: any }): Promise<Audit> {
    const id = randomUUID();
    const auditLog: Audit = {
      id,
      timestamp: new Date(),
      actor: auditData.actor,
      action: auditData.action,
      meta: auditData.meta || null,
      createdAt: new Date()
    };
    this.auditLogs.set(id, auditLog);
    return auditLog;
  }
}

export const storage = new MemStorage();
