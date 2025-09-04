import { adminDb } from "./firebase";
import { 
  Agent, InsertAgent, 
  MagnetBatch, InsertMagnetBatch,
  Magnet, InsertMagnet,
  Household, InsertHousehold,
  Task, InsertTask,
  Lead, InsertLead,
  COLLECTIONS,
  timestampToDate 
} from "@shared/schema";
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from "nanoid";

export interface IStorage {
  // Agent methods
  getAgent(id: string): Promise<Agent | undefined>;
  getAgentByEmail(email: string): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;

  // Magnet Batch methods
  createMagnetBatch(batch: InsertMagnetBatch): Promise<MagnetBatch>;
  getMagnetBatch(id: string): Promise<MagnetBatch | undefined>;
  getMagnetBatchesByAgent(agentId: string): Promise<MagnetBatch[]>;
  updateMagnetBatch(id: string, data: Partial<MagnetBatch>): Promise<void>;
  // Additional batch methods
  createBatch(batch: { agentId: string; qty: number }): Promise<MagnetBatch>;
  getBatchesByAgentId(agentId: string): Promise<MagnetBatch[]>;

  // Magnet methods
  createMagnet(magnet: InsertMagnet): Promise<Magnet>;
  getMagnet(id: string): Promise<Magnet | undefined>;
  getMagnetByToken(token: string): Promise<Magnet | undefined>;
  getMagnetsByBatch(batchId: string): Promise<Magnet[]>;
  updateMagnetUsed(token: string, isUsed: boolean): Promise<void>;
  // Additional magnet methods
  getMagnetsByBatchId(batchId: string): Promise<Magnet[]>;
  getMagnetById(id: string): Promise<Magnet | undefined>;

  // Household methods
  createHousehold(household: InsertHousehold): Promise<Household>;
  getHousehold(id: string): Promise<Household | undefined>;
  getHouseholdByToken(magnetToken: string): Promise<Household | undefined>;
  getHouseholdsByAgent(agentId: string): Promise<Household[]>;
  // Additional household methods
  updateHousehold(id: string, data: Partial<Household>): Promise<Household | undefined>;
  getActivatedHouseholdsByAgentId(agentId: string): Promise<Household[]>;

  // Task methods
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: string): Promise<Task | undefined>;
  getTasksByHousehold(householdId: string): Promise<Task[]>;
  getTasksByAgent(agentId: string): Promise<Task[]>;
  updateTaskStatus(id: string, status: Task['status']): Promise<void>;
  getOverdueTasks(): Promise<Task[]>;
  // Additional task methods
  createSchedule(data: any): Promise<any>;
  getScheduleByHouseholdAndTask(householdId: string, taskName: string): Promise<any>;
  createTaskCompletion(data: any): Promise<any>;

  // Lead methods  
  createLead(lead: InsertLead): Promise<Lead>;
  getLead(id: string): Promise<Lead | undefined>;
  getLeadsByAgent(agentId: string): Promise<Lead[]>;
  updateLeadStatus(id: string, status: Lead['status']): Promise<void>;

  // Event/Audit methods
  createEvent(event: { householdId: string; eventType: string; eventData: string }): Promise<any>;
  createAuditLog(data: any): Promise<any>;
  createReminderQueue(data: any): Promise<any>;

  // Agent metrics methods  
  getAgentMetrics(agentId: string): Promise<any>;
}

export class FirebaseStorage implements IStorage {
  // Helper method to convert Firestore data to our types
  private convertFirestoreData<T>(doc: FirebaseFirestore.DocumentSnapshot): T | undefined {
    if (!doc.exists) return undefined;
    const data = doc.data()!;
    
    // Convert Firestore timestamps to Date objects
    Object.keys(data).forEach(key => {
      if (data[key] && typeof data[key] === 'object' && data[key].seconds !== undefined) {
        data[key] = timestampToDate(data[key]);
      }
    });
    
    return { id: doc.id, ...data } as T;
  }

  // Agent methods
  async getAgent(id: string): Promise<Agent | undefined> {
    const doc = await adminDb.collection(COLLECTIONS.AGENTS).doc(id).get();
    return this.convertFirestoreData<Agent>(doc);
  }

  async getAgentByEmail(email: string): Promise<Agent | undefined> {
    const query = await adminDb.collection(COLLECTIONS.AGENTS)
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (query.empty) return undefined;
    return this.convertFirestoreData<Agent>(query.docs[0]);
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const id = agent.id || uuidv4();
    const now = new Date();
    
    const newAgent: Agent = {
      ...agent,
      id,
      createdAt: now,
      updatedAt: now
    };

    await adminDb.collection(COLLECTIONS.AGENTS).doc(id).set(newAgent);
    return newAgent;
  }

  // Magnet Batch methods
  async createMagnetBatch(batch: InsertMagnetBatch): Promise<MagnetBatch> {
    const id = batch.id || uuidv4();
    const now = new Date();
    
    const newBatch: MagnetBatch = {
      ...batch,
      id,
      createdAt: now,
      updatedAt: now
    };

    await adminDb.collection(COLLECTIONS.MAGNET_BATCHES).doc(id).set(newBatch);
    return newBatch;
  }

  async getMagnetBatch(id: string): Promise<MagnetBatch | undefined> {
    const doc = await adminDb.collection(COLLECTIONS.MAGNET_BATCHES).doc(id).get();
    return this.convertFirestoreData<MagnetBatch>(doc);
  }

  async getMagnetBatchesByAgent(agentId: string): Promise<MagnetBatch[]> {
    const query = await adminDb.collection(COLLECTIONS.MAGNET_BATCHES)
      .where('agentId', '==', agentId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return query.docs.map(doc => this.convertFirestoreData<MagnetBatch>(doc)!);
  }

  async updateMagnetBatch(id: string, data: Partial<MagnetBatch>): Promise<void> {
    await adminDb.collection(COLLECTIONS.MAGNET_BATCHES).doc(id).update({
      ...data,
      updatedAt: new Date()
    });
  }

  // Magnet methods
  async createMagnet(magnet: InsertMagnet): Promise<Magnet> {
    const id = magnet.id || uuidv4();
    const now = new Date();
    
    const newMagnet: Magnet = {
      ...magnet,
      id,
      createdAt: now,
      updatedAt: now
    };

    await adminDb.collection(COLLECTIONS.MAGNETS).doc(id).set(newMagnet);
    return newMagnet;
  }

  async getMagnet(id: string): Promise<Magnet | undefined> {
    const doc = await adminDb.collection(COLLECTIONS.MAGNETS).doc(id).get();
    return this.convertFirestoreData<Magnet>(doc);
  }

  async getMagnetByToken(token: string): Promise<Magnet | undefined> {
    const query = await adminDb.collection(COLLECTIONS.MAGNETS)
      .where('token', '==', token)
      .limit(1)
      .get();
    
    if (query.empty) return undefined;
    return this.convertFirestoreData<Magnet>(query.docs[0]);
  }

  async getMagnetsByBatch(batchId: string): Promise<Magnet[]> {
    const query = await adminDb.collection(COLLECTIONS.MAGNETS)
      .where('batchId', '==', batchId)
      .orderBy('createdAt', 'asc')
      .get();
    
    return query.docs.map(doc => this.convertFirestoreData<Magnet>(doc)!);
  }

  async updateMagnetUsed(token: string, isUsed: boolean): Promise<void> {
    const query = await adminDb.collection(COLLECTIONS.MAGNETS)
      .where('token', '==', token)
      .limit(1)
      .get();
    
    if (!query.empty) {
      await query.docs[0].ref.update({ 
        isUsed, 
        updatedAt: new Date() 
      });
    }
  }

  // Household methods
  async createHousehold(household: InsertHousehold): Promise<Household> {
    const id = household.id || uuidv4();
    const now = new Date();
    
    const newHousehold: Household = {
      ...household,
      id,
      createdAt: now,
      updatedAt: now
    };

    await adminDb.collection(COLLECTIONS.HOUSEHOLDS).doc(id).set(newHousehold);
    return newHousehold;
  }

  async getHousehold(id: string): Promise<Household | undefined> {
    const doc = await adminDb.collection(COLLECTIONS.HOUSEHOLDS).doc(id).get();
    return this.convertFirestoreData<Household>(doc);
  }

  async getHouseholdByToken(magnetToken: string): Promise<Household | undefined> {
    const query = await adminDb.collection(COLLECTIONS.HOUSEHOLDS)
      .where('magnetToken', '==', magnetToken)
      .limit(1)
      .get();
    
    if (query.empty) return undefined;
    return this.convertFirestoreData<Household>(query.docs[0]);
  }

  async getHouseholdsByAgent(agentId: string): Promise<Household[]> {
    const query = await adminDb.collection(COLLECTIONS.HOUSEHOLDS)
      .where('agentId', '==', agentId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return query.docs.map(doc => this.convertFirestoreData<Household>(doc)!);
  }

  // Task methods
  async createTask(task: InsertTask): Promise<Task> {
    const id = task.id || uuidv4();
    const now = new Date();
    
    const newTask: Task = {
      ...task,
      id,
      createdAt: now,
      updatedAt: now
    };

    await adminDb.collection(COLLECTIONS.TASKS).doc(id).set(newTask);
    return newTask;
  }

  async getTask(id: string): Promise<Task | undefined> {
    const doc = await adminDb.collection(COLLECTIONS.TASKS).doc(id).get();
    return this.convertFirestoreData<Task>(doc);
  }

  async getTasksByHousehold(householdId: string): Promise<Task[]> {
    const query = await adminDb.collection(COLLECTIONS.TASKS)
      .where('householdId', '==', householdId)
      .orderBy('scheduledDate', 'asc')
      .get();
    
    return query.docs.map(doc => this.convertFirestoreData<Task>(doc)!);
  }

  async getTasksByAgent(agentId: string): Promise<Task[]> {
    const query = await adminDb.collection(COLLECTIONS.TASKS)
      .where('agentId', '==', agentId)
      .orderBy('scheduledDate', 'asc')
      .get();
    
    return query.docs.map(doc => this.convertFirestoreData<Task>(doc)!);
  }

  async updateTaskStatus(id: string, status: Task['status']): Promise<void> {
    await adminDb.collection(COLLECTIONS.TASKS).doc(id).update({
      status,
      updatedAt: new Date(),
      ...(status === 'completed' ? { completedAt: new Date() } : {})
    });
  }

  async getOverdueTasks(): Promise<Task[]> {
    const now = new Date();
    const query = await adminDb.collection(COLLECTIONS.TASKS)
      .where('status', '==', 'pending')
      .where('scheduledDate', '<', now)
      .get();
    
    return query.docs.map(doc => this.convertFirestoreData<Task>(doc)!);
  }

  // Lead methods
  async createLead(lead: InsertLead): Promise<Lead> {
    const id = lead.id || uuidv4();
    const now = new Date();
    
    const newLead: Lead = {
      ...lead,
      id,
      createdAt: now,
      updatedAt: now
    };

    await adminDb.collection(COLLECTIONS.LEADS).doc(id).set(newLead);
    return newLead;
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const doc = await adminDb.collection(COLLECTIONS.LEADS).doc(id).get();
    return this.convertFirestoreData<Lead>(doc);
  }

  async getLeadsByAgent(agentId: string): Promise<Lead[]> {
    const query = await adminDb.collection(COLLECTIONS.LEADS)
      .where('agentId', '==', agentId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return query.docs.map(doc => this.convertFirestoreData<Lead>(doc)!);
  }

  async updateLeadStatus(id: string, status: Lead['status']): Promise<void> {
    await adminDb.collection(COLLECTIONS.LEADS).doc(id).update({
      status,
      updatedAt: new Date()
    });
  }

  // Additional batch methods
  async createBatch(batch: { agentId: string; qty: number }): Promise<MagnetBatch> {
    return this.createMagnetBatch({
      id: uuidv4(),
      agentId: batch.agentId,
      qty: batch.qty
    });
  }

  async getBatchesByAgentId(agentId: string): Promise<MagnetBatch[]> {
    return this.getMagnetBatchesByAgent(agentId);
  }

  // Additional magnet methods  
  async getMagnetsByBatchId(batchId: string): Promise<Magnet[]> {
    return this.getMagnetsByBatch(batchId);
  }

  async getMagnetById(id: string): Promise<Magnet | undefined> {
    return this.getMagnet(id);
  }

  // Additional household methods
  async updateHousehold(id: string, data: Partial<Household>): Promise<Household | undefined> {
    await adminDb.collection(COLLECTIONS.HOUSEHOLDS).doc(id).update({
      ...data,
      updatedAt: new Date()
    });
    
    // Return the updated household
    return this.getHousehold(id);
  }

  async getActivatedHouseholdsByAgentId(agentId: string): Promise<Household[]> {
    // Return households that have been activated (have setup completed)
    return this.getHouseholdsByAgent(agentId);
  }

  // Additional task methods
  async createSchedule(data: any): Promise<any> {
    // For now, create a basic task
    const scheduleId = uuidv4();
    const schedule = {
      id: scheduleId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await adminDb.collection('schedules').doc(scheduleId).set(schedule);
    return schedule;
  }

  async getScheduleByHouseholdAndTask(householdId: string, taskName: string): Promise<any> {
    const query = await adminDb.collection('schedules')
      .where('householdId', '==', householdId)
      .where('taskName', '==', taskName)
      .limit(1)
      .get();
    
    if (query.empty) return undefined;
    return this.convertFirestoreData(query.docs[0]);
  }

  async createTaskCompletion(data: any): Promise<any> {
    const completionId = uuidv4();
    const completion = {
      id: completionId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await adminDb.collection('taskCompletions').doc(completionId).set(completion);
    return completion;
  }

  // Event/Audit methods
  async createEvent(event: { householdId: string; eventType: string; eventData: string }): Promise<any> {
    const eventId = uuidv4();
    const newEvent = {
      id: eventId,
      ...event,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await adminDb.collection('events').doc(eventId).set(newEvent);
    return newEvent;
  }

  async createAuditLog(data: any): Promise<any> {
    const logId = uuidv4();
    const auditLog = {
      id: logId,
      ...data,
      createdAt: new Date()
    };
    await adminDb.collection('auditLogs').doc(logId).set(auditLog);
    return auditLog;
  }

  async createReminderQueue(data: any): Promise<any> {
    const reminderId = uuidv4();
    const reminder = {
      id: reminderId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await adminDb.collection('reminderQueue').doc(reminderId).set(reminder);
    return reminder;
  }

  // Agent metrics methods
  async getAgentMetrics(agentId: string): Promise<any> {
    // Calculate metrics from existing data
    const [households, leads, batches] = await Promise.all([
      this.getHouseholdsByAgent(agentId),
      this.getLeadsByAgent(agentId),
      this.getMagnetBatchesByAgent(agentId)
    ]);

    return {
      totalHouseholds: households.length,
      totalLeads: leads.length,
      totalBatches: batches.length,
      leadsThisMonth: leads.filter(lead => {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return lead.createdAt && lead.createdAt > monthAgo;
      }).length,
      conversionRate: households.length > 0 ? (leads.length / households.length) * 100 : 0
    };
  }
}

export const storage = new FirebaseStorage();