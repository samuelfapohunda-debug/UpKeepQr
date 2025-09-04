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

  // Magnet methods
  createMagnet(magnet: InsertMagnet): Promise<Magnet>;
  getMagnet(id: string): Promise<Magnet | undefined>;
  getMagnetByToken(token: string): Promise<Magnet | undefined>;
  getMagnetsByBatch(batchId: string): Promise<Magnet[]>;
  updateMagnetUsed(token: string, isUsed: boolean): Promise<void>;

  // Household methods
  createHousehold(household: InsertHousehold): Promise<Household>;
  getHousehold(id: string): Promise<Household | undefined>;
  getHouseholdByToken(magnetToken: string): Promise<Household | undefined>;
  getHouseholdsByAgent(agentId: string): Promise<Household[]>;

  // Task methods
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: string): Promise<Task | undefined>;
  getTasksByHousehold(householdId: string): Promise<Task[]>;
  getTasksByAgent(agentId: string): Promise<Task[]>;
  updateTaskStatus(id: string, status: Task['status']): Promise<void>;
  getOverdueTasks(): Promise<Task[]>;

  // Lead methods  
  createLead(lead: InsertLead): Promise<Lead>;
  getLead(id: string): Promise<Lead | undefined>;
  getLeadsByAgent(agentId: string): Promise<Lead[]>;
  updateLeadStatus(id: string, status: Lead['status']): Promise<void>;
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
}

export const storage = new FirebaseStorage();