import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { tinyPNGService } from "./services/tinypng";
import { apiKeyManager } from "./services/apiKeyManager";
import { insertApiKeySchema, insertCompressionSchema } from "@shared/schema";
import { z } from "zod";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Load auth config
      const fs = await import("fs/promises");
      const path = await import("path");
      const configPath = path.resolve(process.cwd(), "attached_assets", "auth-config.json");
      
      try {
        const configData = await fs.readFile(configPath, "utf8");
        const authConfig = JSON.parse(configData);
        
        const user = authConfig.users.find((u: any) => 
          u.username === username && u.password === password
        );
        
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          res.json({ 
            success: true, 
            user: userWithoutPassword,
            message: "Login successful"
          });
        } else {
          res.status(401).json({ 
            success: false, 
            message: "Invalid username or password" 
          });
        }
      } catch (error) {
        console.error("Failed to load auth config:", error);
        res.status(500).json({ message: "Authentication service unavailable" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      const keyUsage = await apiKeyManager.getKeyUsage();
      
      res.json({
        ...stats,
        apiKeyUsage: keyUsage,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Upload and compress images
  app.post("/api/upload", upload.array('images'), async (req: Request, res) => {
    try {
      console.log("=== Upload request received ===");
      console.log("Request files:", req.files);
      console.log("Request body:", req.body);
      
      const files = req.files as Express.Multer.File[];
      if (!files || !Array.isArray(files) || files.length === 0) {
        console.log("No files in request");
        return res.status(400).json({ message: "No files uploaded" });
      }

      console.log(`Processing ${files.length} files`);
      const results = [];

      for (const file of files) {
        console.log(`Processing file: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);
        
        // Validate file
        if (!file.buffer) {
          console.error("File buffer is missing");
          results.push({
            filename: file.originalname,
            status: "failed",
            error: "File buffer is missing",
          });
          continue;
        }
        // Create compression record
        const compression = await storage.createCompression({
          filename: file.originalname,
          originalSize: file.size,
        });

        try {
          // Update status to processing
          await storage.updateCompression(compression.id, { status: "processing" });

          // Compress the image
          const result = await tinyPNGService.compressImage(file.buffer);
          const savingsPercent = ((result.originalSize - result.compressedSize) / result.originalSize) * 100;

          // Update compression record with results
          await storage.updateCompression(compression.id, {
            status: "completed",
            compressedSize: result.compressedSize,
            savingsPercent,
            completedAt: new Date(),
          });

          results.push({
            id: compression.id,
            filename: file.originalname,
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
            savingsPercent,
            status: "completed",
          });

        } catch (error: any) {
          // Update compression record with error
          await storage.updateCompression(compression.id, {
            status: "failed",
            errorMessage: error.message,
            completedAt: new Date(),
          });

          results.push({
            id: compression.id,
            filename: file.originalname,
            originalSize: file.size,
            status: "failed",
            error: error.message,
          });
        }
      }

      res.json({ results });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all API keys
  app.get("/api/api-keys", async (req, res) => {
    try {
      const apiKeys = await storage.getApiKeys();
      const keyUsage = await apiKeyManager.getKeyUsage();
      
      const keysWithUsage = apiKeys.map(key => {
        const usage = keyUsage.find(u => u.key === key.key);
        return {
          ...key,
          currentUsage: usage?.used || 0,
          monthlyLimit: usage?.limit || 500,
        };
      });

      res.json(keysWithUsage);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Add new API key
  app.post("/api/api-keys", async (req, res) => {
    try {
      const validatedData = insertApiKeySchema.parse(req.body);
      
      // Validate the API key with TinyPNG
      const isValid = await tinyPNGService.validateApiKey(validatedData.key);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid API key" });
      }

      // Add to API key manager
      await apiKeyManager.addApiKey(validatedData.key);

      // Store in database
      const apiKey = await storage.createApiKey(validatedData);

      res.status(201).json(apiKey);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Update API key
  app.put("/api/api-keys/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const apiKey = await storage.updateApiKey(id, updates);
      if (!apiKey) {
        return res.status(404).json({ message: "API key not found" });
      }

      res.json(apiKey);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete API key
  app.delete("/api/api-keys/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const apiKey = await storage.getApiKey(id);
      if (!apiKey) {
        return res.status(404).json({ message: "API key not found" });
      }

      // Remove from API key manager
      await apiKeyManager.removeApiKey(apiKey.key);

      // Delete from storage
      await storage.deleteApiKey(id);

      res.json({ message: "API key deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all compressions
  app.get("/api/compressions", async (req, res) => {
    try {
      const compressions = await storage.getCompressions();
      res.json(compressions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get specific compression
  app.get("/api/compressions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const compression = await storage.getCompression(id);
      
      if (!compression) {
        return res.status(404).json({ message: "Compression not found" });
      }

      res.json(compression);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete compression
  app.delete("/api/compressions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCompression(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Compression not found" });
      }

      res.json({ message: "Compression deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
