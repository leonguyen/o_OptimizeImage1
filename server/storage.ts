import { type User, type InsertUser, type ApiKey, type InsertApiKey, type Compression, type InsertCompression } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getApiKeys(): Promise<ApiKey[]>;
  getApiKey(id: string): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: string, updates: Partial<ApiKey>): Promise<ApiKey | undefined>;
  deleteApiKey(id: string): Promise<boolean>;
  
  getCompressions(): Promise<Compression[]>;
  getCompression(id: string): Promise<Compression | undefined>;
  createCompression(compression: InsertCompression): Promise<Compression>;
  updateCompression(id: string, updates: Partial<Compression>): Promise<Compression | undefined>;
  deleteCompression(id: string): Promise<boolean>;
  
  getStats(): Promise<{
    totalCompressions: number;
    totalSpaceSaved: number;
    activeApiKeys: number;
    successRate: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private apiKeys: Map<string, ApiKey>;
  private compressions: Map<string, Compression>;

  constructor() {
    this.users = new Map();
    this.apiKeys = new Map();
    this.compressions = new Map();
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

  async getApiKeys(): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getApiKey(id: string): Promise<ApiKey | undefined> {
    return this.apiKeys.get(id);
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const id = randomUUID();
    const apiKey: ApiKey = {
      ...insertApiKey,
      id,
      description: insertApiKey.description || null,
      monthlyLimit: insertApiKey.monthlyLimit || 500,
      currentUsage: 0,
      isActive: true,
      createdAt: new Date(),
      lastUsed: null,
    };
    this.apiKeys.set(id, apiKey);
    return apiKey;
  }

  async updateApiKey(id: string, updates: Partial<ApiKey>): Promise<ApiKey | undefined> {
    const apiKey = this.apiKeys.get(id);
    if (!apiKey) return undefined;
    
    const updatedApiKey = { ...apiKey, ...updates };
    this.apiKeys.set(id, updatedApiKey);
    return updatedApiKey;
  }

  async deleteApiKey(id: string): Promise<boolean> {
    return this.apiKeys.delete(id);
  }

  async getCompressions(): Promise<Compression[]> {
    return Array.from(this.compressions.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getCompression(id: string): Promise<Compression | undefined> {
    return this.compressions.get(id);
  }

  async createCompression(insertCompression: InsertCompression): Promise<Compression> {
    const id = randomUUID();
    const compression: Compression = {
      ...insertCompression,
      id,
      compressedSize: null,
      savingsPercent: null,
      status: "pending",
      apiKeyId: null,
      createdAt: new Date(),
      completedAt: null,
      errorMessage: null,
    };
    this.compressions.set(id, compression);
    return compression;
  }

  async updateCompression(id: string, updates: Partial<Compression>): Promise<Compression | undefined> {
    const compression = this.compressions.get(id);
    if (!compression) return undefined;
    
    const updatedCompression = { ...compression, ...updates };
    this.compressions.set(id, updatedCompression);
    return updatedCompression;
  }

  async deleteCompression(id: string): Promise<boolean> {
    return this.compressions.delete(id);
  }

  async getStats(): Promise<{
    totalCompressions: number;
    totalSpaceSaved: number;
    activeApiKeys: number;
    successRate: number;
  }> {
    const compressions = Array.from(this.compressions.values());
    const apiKeys = Array.from(this.apiKeys.values());
    
    const completedCompressions = compressions.filter(c => c.status === "completed");
    const totalSpaceSaved = completedCompressions.reduce((sum, c) => 
      sum + (c.originalSize - (c.compressedSize || 0)), 0
    );
    
    const successRate = compressions.length > 0 
      ? (completedCompressions.length / compressions.length) * 100 
      : 0;

    return {
      totalCompressions: compressions.length,
      totalSpaceSaved: Math.round(totalSpaceSaved / (1024 * 1024)), // Convert to MB
      activeApiKeys: apiKeys.filter(k => k.isActive).length,
      successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
    };
  }
}

export const storage = new MemStorage();
