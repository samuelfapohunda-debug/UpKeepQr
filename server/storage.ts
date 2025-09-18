import { adminDb } from "./firebase";
import { 
  Agent, InsertAgent, 
  MagnetBatch, InsertMagnetBatch,
  Magnet, InsertMagnet,
  Household, InsertHousehold,
  Task, InsertTask,
  Lead, InsertLead,
  ProRequest, InsertProRequest,
  Provider, InsertProvider,
  AuditEvent, InsertAuditEvent,
  Note, InsertNote,
  AdminProRequestFilters,
  OrderMagnetOrder, InsertOrderMagnetOrder,
  OrderMagnetItem, InsertOrderMagnetItem,
  OrderMagnetBatch, InsertOrderMagnetBatch,
  OrderMagnetShipment, InsertOrderMagnetShipment,
  OrderMagnetAuditEvent, InsertOrderMagnetAuditEvent,
  ContactMessage, InsertContactMessage,
  AdminContactMessageFilters,
  proRequestsTable,
  providersTable,
  auditEventsTable,
  notesTable,
  orderMagnetOrdersTable,
  orderMagnetItemsTable,
  orderMagnetBatchesTable,
  orderMagnetShipmentsTable,
  orderMagnetAuditEventsTable,
  contactMessagesTable,
  COLLECTIONS,
  timestampToDate 
} from "@shared/schema";
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from "nanoid";
import { eq, and, like, sql, desc, asc, or, inArray } from "drizzle-orm";
import { db } from "./db";

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

  // Pro Request methods
  createProRequest(proRequest: InsertProRequest): Promise<ProRequest>;
  getProRequest(id: string): Promise<ProRequest | undefined>;
  getProRequestByTrackingCode(trackingCode: string): Promise<ProRequest | undefined>;
  updateProRequestStatus(id: string, status: string, providerAssigned?: string): Promise<ProRequest | undefined>;
  getAllProRequests(): Promise<ProRequest[]>;

  // Provider methods
  createProvider(provider: InsertProvider): Promise<Provider>;
  getProvider(id: string): Promise<Provider | undefined>;
  getProvidersByTradeAndZip(trade: string, zip: string): Promise<Provider[]>;
  getAllProviders(): Promise<Provider[]>;
  searchProviders(trade?: string, zip?: string, q?: string): Promise<Provider[]>;

  // Admin Pro Request methods
  getAdminProRequests(filters: AdminProRequestFilters): Promise<{ items: ProRequest[]; total: number; page: number; pageSize: number }>;
  getAdminProRequest(id: string): Promise<ProRequest | undefined>;
  updateAdminProRequestStatus(id: string, status: string, providerAssigned?: string): Promise<ProRequest | undefined>;
  
  // Note methods
  createNote(note: InsertNote): Promise<Note>;
  getNotesByRequest(requestId: string): Promise<Note[]>;
  
  // Audit Event methods
  createAuditEvent(auditEvent: InsertAuditEvent): Promise<AuditEvent>;
  getAuditEventsByRequest(requestId: string): Promise<AuditEvent[]>;

  // Order Magnet methods
  // Order operations
  createOrderMagnetOrder(order: InsertOrderMagnetOrder): Promise<OrderMagnetOrder>;
  getOrderMagnetOrder(id: string): Promise<OrderMagnetOrder | undefined>;
  getAllOrderMagnetOrders(): Promise<OrderMagnetOrder[]>;
  getOrderMagnetOrdersByStatus(status: string): Promise<OrderMagnetOrder[]>;
  updateOrderMagnetOrderStatus(id: string, status: string): Promise<OrderMagnetOrder | undefined>;
  
  // Item operations
  createOrderMagnetItem(item: InsertOrderMagnetItem): Promise<OrderMagnetItem>;
  getOrderMagnetItem(id: string): Promise<OrderMagnetItem | undefined>;
  getOrderMagnetItemsByOrder(orderId: string): Promise<OrderMagnetItem[]>;
  getOrderMagnetItemsByBatch(batchId: string): Promise<OrderMagnetItem[]>;
  updateOrderMagnetItemStatus(id: string, activationStatus: string): Promise<OrderMagnetItem | undefined>;
  
  // Batch operations
  createOrderMagnetBatch(batch: InsertOrderMagnetBatch): Promise<OrderMagnetBatch>;
  getOrderMagnetBatch(id: string): Promise<OrderMagnetBatch | undefined>;
  getAllOrderMagnetBatches(): Promise<OrderMagnetBatch[]>;
  updateOrderMagnetBatchStatus(id: string, status: string): Promise<OrderMagnetBatch | undefined>;
  
  // Shipment operations  
  createOrderMagnetShipment(shipment: InsertOrderMagnetShipment): Promise<OrderMagnetShipment>;
  getOrderMagnetShipment(id: string): Promise<OrderMagnetShipment | undefined>;
  getOrderMagnetShipmentsByOrder(orderId: string): Promise<OrderMagnetShipment[]>;
  updateOrderMagnetShipmentStatus(id: string, status: string): Promise<OrderMagnetShipment | undefined>;
  
  // Audit event operations
  createOrderMagnetAuditEvent(auditEvent: InsertOrderMagnetAuditEvent): Promise<OrderMagnetAuditEvent>;
  getOrderMagnetAuditEventsByOrder(orderId: string): Promise<OrderMagnetAuditEvent[]>;
  getOrderMagnetAuditEventsByItem(itemId: string): Promise<OrderMagnetAuditEvent[]>;

  // Contact Message methods
  createContactMessage(contactMessage: InsertContactMessage & { ticketId: string; sourceIp?: string }): Promise<ContactMessage>;
  getContactMessage(id: string): Promise<ContactMessage | undefined>;
  getContactMessages(filters: AdminContactMessageFilters): Promise<{ items: ContactMessage[]; total: number; page: number; pageSize: number }>;
  updateContactMessageStatus(id: string, status: 'new' | 'read' | 'replied'): Promise<ContactMessage | undefined>;
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
      .get();
    
    const batches = query.docs.map(doc => this.convertFirestoreData<MagnetBatch>(doc)!);
    // Sort in memory instead of using orderBy to avoid index requirement
    return batches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
    // Handle demo token when Firebase is disabled
    if (token === 'demo-token') {
      return {
        id: 'demo-magnet',
        batchId: 'demo-batch',
        agentId: 'demo-agent',
        token: 'demo-token',
        isUsed: false,
        setupUrl: `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/setup/demo-token`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

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
      .get();
    
    const households = query.docs.map(doc => this.convertFirestoreData<Household>(doc)!);
    // Sort in memory instead of using orderBy to avoid index requirement
    return households.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
      .get();
    
    const leads = query.docs.map(doc => this.convertFirestoreData<Lead>(doc)!);
    // Sort in memory instead of using orderBy to avoid index requirement
    return leads.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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

  // Pro Request methods (using PostgreSQL via Drizzle)
  async createProRequest(proRequest: InsertProRequest): Promise<ProRequest> {
    const id = uuidv4();
    const publicTrackingCode = nanoid(8);
    const now = new Date();
    
    const newProRequest = {
      id,
      ...proRequest,
      publicTrackingCode,
      status: 'new' as const,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(proRequestsTable).values(newProRequest);
    
    return newProRequest;
  }

  async getProRequest(id: string): Promise<ProRequest | undefined> {
    const result = await db.select().from(proRequestsTable).where(eq(proRequestsTable.id, id)).limit(1);
    return result[0] || undefined;
  }

  async getProRequestByTrackingCode(trackingCode: string): Promise<ProRequest | undefined> {
    const result = await db.select().from(proRequestsTable)
      .where(eq(proRequestsTable.publicTrackingCode, trackingCode))
      .limit(1);
    return result[0] || undefined;
  }

  async updateProRequestStatus(id: string, status: string, providerAssigned?: string): Promise<ProRequest | undefined> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };
    
    if (providerAssigned !== undefined) {
      updateData.providerAssigned = providerAssigned;
    }

    await db.update(proRequestsTable)
      .set(updateData)
      .where(eq(proRequestsTable.id, id));
    
    return this.getProRequest(id);
  }

  async getAllProRequests(): Promise<ProRequest[]> {
    const result = await db.select().from(proRequestsTable);
    return result;
  }

  // Provider methods (using PostgreSQL via Drizzle)
  async createProvider(provider: InsertProvider): Promise<Provider> {
    const id = uuidv4();
    const now = new Date();
    
    const newProvider = {
      id,
      ...provider,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(providersTable).values(newProvider);
    
    return newProvider;
  }

  async getProvider(id: string): Promise<Provider | undefined> {
    const result = await db.select().from(providersTable).where(eq(providersTable.id, id)).limit(1);
    return result[0] || undefined;
  }

  async getProvidersByTradeAndZip(trade: string, zip: string): Promise<Provider[]> {
    // Get all providers with matching trade
    const result = await db.select().from(providersTable).where(eq(providersTable.trade, trade));
    
    // Filter by zip coverage - check if the requested zip is in their coverage area
    return result.filter(provider => {
      if (!provider.coverageZips || !Array.isArray(provider.coverageZips)) {
        return false;
      }
      return provider.coverageZips.includes(zip);
    });
  }

  async getAllProviders(): Promise<Provider[]> {
    const result = await db.select().from(providersTable);
    return result;
  }

  async searchProviders(trade?: string, zip?: string, q?: string): Promise<Provider[]> {
    let query = db.select().from(providersTable);
    
    // Apply trade filter if provided
    if (trade) {
      query = query.where(eq(providersTable.trade, trade));
    }
    
    let result = await query;
    
    // Filter by zip coverage if provided
    if (zip) {
      result = result.filter(provider => {
        if (!provider.coverageZips || !Array.isArray(provider.coverageZips)) {
          return false;
        }
        return provider.coverageZips.includes(zip);
      });
    }
    
    // Filter by search query if provided
    if (q) {
      const searchTerm = q.toLowerCase();
      result = result.filter(provider => 
        provider.name.toLowerCase().includes(searchTerm) ||
        provider.email.toLowerCase().includes(searchTerm) ||
        provider.phone.includes(searchTerm)
      );
    }
    
    return result;
  }

  // Admin Pro Request methods
  async getAdminProRequests(filters: AdminProRequestFilters): Promise<{ items: ProRequest[]; total: number; page: number; pageSize: number }> {
    let query = db.select().from(proRequestsTable);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(proRequestsTable);
    
    const conditions = [];
    
    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      conditions.push(inArray(proRequestsTable.status, filters.status));
    }
    
    // Apply trade filter
    if (filters.trade) {
      conditions.push(eq(proRequestsTable.trade, filters.trade));
    }
    
    // Apply urgency filter
    if (filters.urgency) {
      conditions.push(eq(proRequestsTable.urgency, filters.urgency));
    }
    
    // Apply zip filter
    if (filters.zip) {
      conditions.push(eq(proRequestsTable.zip, filters.zip));
    }
    
    // Apply provider filter
    if (filters.providerAssigned) {
      conditions.push(like(proRequestsTable.providerAssigned, `%${filters.providerAssigned}%`));
    }
    
    // Apply search query
    if (filters.q) {
      const searchTerm = `%${filters.q}%`;
      conditions.push(or(
        like(proRequestsTable.description, searchTerm),
        like(proRequestsTable.contactName, searchTerm),
        like(proRequestsTable.contactEmail, searchTerm),
        like(proRequestsTable.addressLine1, searchTerm),
        like(proRequestsTable.city, searchTerm)
      ));
    }
    
    // Apply all conditions
    if (conditions.length > 0) {
      const combinedConditions = conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(combinedConditions);
      countQuery = countQuery.where(combinedConditions);
    }
    
    // Apply sorting
    const sortColumn = proRequestsTable[filters.sortBy] || proRequestsTable.createdAt;
    query = query.orderBy(filters.sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn));
    
    // Apply pagination
    const offset = (filters.page - 1) * filters.pageSize;
    query = query.limit(filters.pageSize).offset(offset);
    
    // Execute queries
    const [items, countResult] = await Promise.all([
      query,
      countQuery
    ]);
    
    const total = Number(countResult[0]?.count || 0);
    
    return {
      items,
      total,
      page: filters.page,
      pageSize: filters.pageSize
    };
  }

  async getAdminProRequest(id: string): Promise<ProRequest | undefined> {
    // Same as getProRequest but for admin context (could add admin-specific data later)
    return this.getProRequest(id);
  }

  async updateAdminProRequestStatus(id: string, status: string, providerAssigned?: string): Promise<ProRequest | undefined> {
    // Same as updateProRequestStatus but for admin context
    return this.updateProRequestStatus(id, status, providerAssigned);
  }

  // Note methods
  async createNote(note: InsertNote): Promise<Note> {
    const id = uuidv4();
    const now = new Date();
    
    const newNote = {
      id,
      ...note,
      createdAt: now,
    };

    await db.insert(notesTable).values(newNote);
    
    return newNote;
  }

  async getNotesByRequest(requestId: string): Promise<Note[]> {
    const result = await db.select().from(notesTable)
      .where(eq(notesTable.requestId, requestId))
      .orderBy(desc(notesTable.createdAt));
    return result;
  }

  // Audit Event methods
  async createAuditEvent(auditEvent: InsertAuditEvent): Promise<AuditEvent> {
    const id = uuidv4();
    const now = new Date();
    
    const newAuditEvent = {
      id,
      ...auditEvent,
      createdAt: now,
    };

    await db.insert(auditEventsTable).values(newAuditEvent);
    
    return newAuditEvent;
  }

  async getAuditEventsByRequest(requestId: string): Promise<AuditEvent[]> {
    const result = await db.select().from(auditEventsTable)
      .where(eq(auditEventsTable.requestId, requestId))
      .orderBy(desc(auditEventsTable.createdAt));
    return result;
  }

  // Order Magnet methods (using PostgreSQL via Drizzle)
  // Order operations
  async createOrderMagnetOrder(order: InsertOrderMagnetOrder): Promise<OrderMagnetOrder> {
    const id = uuidv4();
    const activationCode = nanoid(8);
    const now = new Date();
    
    const newOrder = {
      id,
      ...order,
      activationCode,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(orderMagnetOrdersTable).values(newOrder);
    
    return newOrder;
  }

  async getOrderMagnetOrder(id: string): Promise<OrderMagnetOrder | undefined> {
    const result = await db.select().from(orderMagnetOrdersTable).where(eq(orderMagnetOrdersTable.id, id)).limit(1);
    return result[0] || undefined;
  }

  async getAllOrderMagnetOrders(): Promise<OrderMagnetOrder[]> {
    const result = await db.select().from(orderMagnetOrdersTable).orderBy(desc(orderMagnetOrdersTable.createdAt));
    return result;
  }

  async getOrderMagnetOrdersByStatus(status: string): Promise<OrderMagnetOrder[]> {
    const result = await db.select().from(orderMagnetOrdersTable)
      .where(eq(orderMagnetOrdersTable.status, status))
      .orderBy(desc(orderMagnetOrdersTable.createdAt));
    return result;
  }

  async updateOrderMagnetOrderStatus(id: string, status: string): Promise<OrderMagnetOrder | undefined> {
    const updateData = {
      status,
      updatedAt: new Date(),
    };

    await db.update(orderMagnetOrdersTable)
      .set(updateData)
      .where(eq(orderMagnetOrdersTable.id, id));
    
    return this.getOrderMagnetOrder(id);
  }
  
  // Item operations
  async createOrderMagnetItem(item: InsertOrderMagnetItem): Promise<OrderMagnetItem> {
    const id = uuidv4();
    const now = new Date();
    
    const newItem = {
      id,
      ...item,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(orderMagnetItemsTable).values(newItem);
    
    return newItem;
  }

  async getOrderMagnetItem(id: string): Promise<OrderMagnetItem | undefined> {
    const result = await db.select().from(orderMagnetItemsTable).where(eq(orderMagnetItemsTable.id, id)).limit(1);
    return result[0] || undefined;
  }

  async getOrderMagnetItemsByOrder(orderId: string): Promise<OrderMagnetItem[]> {
    const result = await db.select().from(orderMagnetItemsTable)
      .where(eq(orderMagnetItemsTable.orderId, orderId))
      .orderBy(desc(orderMagnetItemsTable.createdAt));
    return result;
  }

  async getOrderMagnetItemsByBatch(batchId: string): Promise<OrderMagnetItem[]> {
    const result = await db.select().from(orderMagnetItemsTable)
      .where(eq(orderMagnetItemsTable.printBatchId, batchId))
      .orderBy(desc(orderMagnetItemsTable.createdAt));
    return result;
  }

  async updateOrderMagnetItemStatus(id: string, activationStatus: string): Promise<OrderMagnetItem | undefined> {
    const updateData = {
      activationStatus,
      updatedAt: new Date(),
    };

    await db.update(orderMagnetItemsTable)
      .set(updateData)
      .where(eq(orderMagnetItemsTable.id, id));
    
    return this.getOrderMagnetItem(id);
  }
  
  // Batch operations
  async createOrderMagnetBatch(batch: InsertOrderMagnetBatch): Promise<OrderMagnetBatch> {
    const id = uuidv4();
    const now = new Date();
    
    const newBatch = {
      id,
      ...batch,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(orderMagnetBatchesTable).values(newBatch);
    
    return newBatch;
  }

  async getOrderMagnetBatch(id: string): Promise<OrderMagnetBatch | undefined> {
    const result = await db.select().from(orderMagnetBatchesTable).where(eq(orderMagnetBatchesTable.id, id)).limit(1);
    return result[0] || undefined;
  }

  async getAllOrderMagnetBatches(): Promise<OrderMagnetBatch[]> {
    const result = await db.select().from(orderMagnetBatchesTable).orderBy(desc(orderMagnetBatchesTable.createdAt));
    return result;
  }

  async updateOrderMagnetBatchStatus(id: string, status: string): Promise<OrderMagnetBatch | undefined> {
    const updateData = {
      status,
      updatedAt: new Date(),
    };

    await db.update(orderMagnetBatchesTable)
      .set(updateData)
      .where(eq(orderMagnetBatchesTable.id, id));
    
    return this.getOrderMagnetBatch(id);
  }
  
  // Shipment operations  
  async createOrderMagnetShipment(shipment: InsertOrderMagnetShipment): Promise<OrderMagnetShipment> {
    const id = uuidv4();
    const now = new Date();
    
    const newShipment = {
      id,
      ...shipment,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(orderMagnetShipmentsTable).values(newShipment);
    
    return newShipment;
  }

  async getOrderMagnetShipment(id: string): Promise<OrderMagnetShipment | undefined> {
    const result = await db.select().from(orderMagnetShipmentsTable).where(eq(orderMagnetShipmentsTable.id, id)).limit(1);
    return result[0] || undefined;
  }

  async getOrderMagnetShipmentsByOrder(orderId: string): Promise<OrderMagnetShipment[]> {
    const result = await db.select().from(orderMagnetShipmentsTable)
      .where(eq(orderMagnetShipmentsTable.orderId, orderId))
      .orderBy(desc(orderMagnetShipmentsTable.createdAt));
    return result;
  }

  async updateOrderMagnetShipmentStatus(id: string, status: string): Promise<OrderMagnetShipment | undefined> {
    const updateData = {
      status,
      updatedAt: new Date(),
    };

    await db.update(orderMagnetShipmentsTable)
      .set(updateData)
      .where(eq(orderMagnetShipmentsTable.id, id));
    
    return this.getOrderMagnetShipment(id);
  }
  
  // Audit event operations
  async createOrderMagnetAuditEvent(auditEvent: InsertOrderMagnetAuditEvent): Promise<OrderMagnetAuditEvent> {
    const id = uuidv4();
    const now = new Date();
    
    const newAuditEvent = {
      id,
      ...auditEvent,
      createdAt: now,
    };

    await db.insert(orderMagnetAuditEventsTable).values(newAuditEvent);
    
    return newAuditEvent;
  }

  async getOrderMagnetAuditEventsByOrder(orderId: string): Promise<OrderMagnetAuditEvent[]> {
    const result = await db.select().from(orderMagnetAuditEventsTable)
      .where(eq(orderMagnetAuditEventsTable.orderId, orderId))
      .orderBy(desc(orderMagnetAuditEventsTable.createdAt));
    return result;
  }

  async getOrderMagnetAuditEventsByItem(itemId: string): Promise<OrderMagnetAuditEvent[]> {
    const result = await db.select().from(orderMagnetAuditEventsTable)
      .where(eq(orderMagnetAuditEventsTable.itemId, itemId))
      .orderBy(desc(orderMagnetAuditEventsTable.createdAt));
    return result;
  }

  // Contact Message methods
  async createContactMessage(contactMessage: InsertContactMessage & { ticketId: string; sourceIp?: string }): Promise<ContactMessage> {
    const id = uuidv4();
    const now = new Date();
    
    const newContactMessage = {
      id,
      ...contactMessage,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(contactMessagesTable).values(newContactMessage);
    
    return newContactMessage;
  }

  async getContactMessage(id: string): Promise<ContactMessage | undefined> {
    const result = await db.select().from(contactMessagesTable)
      .where(eq(contactMessagesTable.id, id))
      .limit(1);
    return result[0];
  }

  async getContactMessages(filters: AdminContactMessageFilters): Promise<{ items: ContactMessage[]; total: number; page: number; pageSize: number }> {
    const { status, q, dateFrom, dateTo, page, pageSize, sortBy, sortDir } = filters;

    // Build where conditions
    const conditions = [];
    
    if (status && status.length > 0) {
      conditions.push(inArray(contactMessagesTable.status, status));
    }
    
    if (q) {
      conditions.push(
        or(
          like(contactMessagesTable.name, `%${q}%`),
          like(contactMessagesTable.email, `%${q}%`),
          like(contactMessagesTable.subject, `%${q}%`),
          like(contactMessagesTable.message, `%${q}%`),
          like(contactMessagesTable.ticketId, `%${q}%`)
        )
      );
    }
    
    if (dateFrom) {
      conditions.push(sql`${contactMessagesTable.createdAt} >= ${new Date(dateFrom)}`);
    }
    
    if (dateTo) {
      conditions.push(sql`${contactMessagesTable.createdAt} <= ${new Date(dateTo)}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db.select({ count: sql`count(*)`.mapWith(Number) })
      .from(contactMessagesTable)
      .where(whereClause);
    const total = totalResult[0]?.count || 0;

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const orderByClause = sortDir === 'asc' 
      ? asc(contactMessagesTable[sortBy]) 
      : desc(contactMessagesTable[sortBy]);

    const items = await db.select().from(contactMessagesTable)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset);

    return {
      items,
      total,
      page,
      pageSize
    };
  }

  async updateContactMessageStatus(id: string, status: 'new' | 'read' | 'replied'): Promise<ContactMessage | undefined> {
    await db.update(contactMessagesTable)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(contactMessagesTable.id, id));
    
    return this.getContactMessage(id);
  }
}

export const storage = new FirebaseStorage();