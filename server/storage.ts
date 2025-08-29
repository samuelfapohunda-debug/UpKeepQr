import { type User, type InsertUser, type Batch, type InsertBatch, type Magnet } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private batches: Map<string, Batch>;
  private magnets: Map<string, Magnet>;

  constructor() {
    this.users = new Map();
    this.batches = new Map();
    this.magnets = new Map();
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
}

export const storage = new MemStorage();
