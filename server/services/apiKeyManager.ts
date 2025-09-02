import fs from "fs/promises";
import path from "path";
import { ApiKey } from "@shared/schema";

interface ApiKeyConfig {
  tinypng: {
    keys: string[];
    currentIndex: number;
    rateLimits: {
      monthly: number;
      used: Record<string, number>;
    };
  };
}

export class ApiKeyManager {
  private configPath: string;
  private config: ApiKeyConfig | null = null;
  private initialized = false;

  constructor() {
    this.configPath = path.resolve(process.cwd(), "attached_assets", "api-keys_1756820575926.json");
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    
    try {
      console.log("Initializing API keys from JSON file...");
      const config = await this.loadConfig();
      console.log(`Found ${config.tinypng.keys.length} API keys in configuration`);
      
      // Auto-sync API keys with storage on startup
      const { storage } = await import("../storage.js");
      
      for (const apiKey of config.tinypng.keys) {
        try {
          // Check if this key already exists in storage
          const existingKeys = await storage.getApiKeys();
          const keyExists = existingKeys.some(k => k.key === apiKey);
          
          if (!keyExists) {
            console.log(`Auto-importing API key: ${apiKey.substring(0, 8)}...`);
            await storage.createApiKey({
              key: apiKey,
              description: "Auto-imported from JSON config",
              monthlyLimit: config.tinypng.rateLimits.monthly,
            });
          }
        } catch (error) {
          console.warn(`Failed to auto-import API key: ${error}`);
        }
      }
      
      this.initialized = true;
      console.log("API key initialization completed");
    } catch (error) {
      console.error(`Failed to initialize API keys: ${error}`);
      throw error;
    }
  }

  async loadConfig(): Promise<ApiKeyConfig> {
    if (this.config) return this.config;

    try {
      const data = await fs.readFile(this.configPath, "utf8");
      this.config = JSON.parse(data);
      return this.config!;
    } catch (error) {
      throw new Error(`Failed to load API key configuration: ${error}`);
    }
  }

  async saveConfig(): Promise<void> {
    if (!this.config) return;

    try {
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      throw new Error(`Failed to save API key configuration: ${error}`);
    }
  }

  async getNextAvailableKey(): Promise<string | null> {
    await this.ensureInitialized();
    const config = await this.loadConfig();
    const { keys, currentIndex, rateLimits } = config.tinypng;
    
    console.log(`Checking ${keys.length} API keys for availability...`);

    // Find a key that hasn't exceeded its monthly limit
    for (let i = 0; i < keys.length; i++) {
      const keyIndex = (currentIndex + i) % keys.length;
      const key = keys[keyIndex];
      const used = rateLimits.used[key] || 0;

      if (used < rateLimits.monthly) {
        // Update current index for next time
        config.tinypng.currentIndex = keyIndex;
        await this.saveConfig();
        console.log(`Using API key: ${key.substring(0, 8)}... (${used}/${rateLimits.monthly} used)`);
        return key;
      } else {
        console.log(`API key ${key.substring(0, 8)}... exhausted (${used}/${rateLimits.monthly})`);
      }
    }

    console.warn("All API keys have been exhausted!");
    return null; // All keys exhausted
  }

  async recordUsage(apiKey: string): Promise<void> {
    const config = await this.loadConfig();
    
    if (!config.tinypng.rateLimits.used[apiKey]) {
      config.tinypng.rateLimits.used[apiKey] = 0;
    }
    
    config.tinypng.rateLimits.used[apiKey]++;
    console.log(`API key usage recorded: ${apiKey.substring(0, 8)}... now at ${config.tinypng.rateLimits.used[apiKey]}/${config.tinypng.rateLimits.monthly}`);
    await this.saveConfig();
  }

  async addApiKey(apiKey: string): Promise<void> {
    const config = await this.loadConfig();
    
    if (!config.tinypng.keys.includes(apiKey)) {
      config.tinypng.keys.push(apiKey);
      config.tinypng.rateLimits.used[apiKey] = 0;
      await this.saveConfig();
    }
  }

  async removeApiKey(apiKey: string): Promise<void> {
    const config = await this.loadConfig();
    
    config.tinypng.keys = config.tinypng.keys.filter(key => key !== apiKey);
    delete config.tinypng.rateLimits.used[apiKey];
    
    // Reset current index if it's out of bounds
    if (config.tinypng.currentIndex >= config.tinypng.keys.length) {
      config.tinypng.currentIndex = 0;
    }
    
    await this.saveConfig();
  }

  async getKeyUsage(): Promise<Array<{ key: string; used: number; limit: number }>> {
    const config = await this.loadConfig();
    
    return config.tinypng.keys.map(key => ({
      key,
      used: config.tinypng.rateLimits.used[key] || 0,
      limit: config.tinypng.rateLimits.monthly,
    }));
  }

  async resetMonthlyUsage(): Promise<void> {
    const config = await this.loadConfig();
    config.tinypng.rateLimits.used = {};
    await this.saveConfig();
  }
}

export const apiKeyManager = new ApiKeyManager();
