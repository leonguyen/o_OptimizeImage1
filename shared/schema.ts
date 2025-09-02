import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  description: text("description"),
  monthlyLimit: integer("monthly_limit").notNull().default(500),
  currentUsage: integer("current_usage").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsed: timestamp("last_used"),
});

export const compressions = pgTable("compressions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalSize: integer("original_size").notNull(),
  compressedSize: integer("compressed_size"),
  savingsPercent: real("savings_percent"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  apiKeyId: varchar("api_key_id").references(() => apiKeys.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  key: true,
  description: true,
  monthlyLimit: true,
});

export const insertCompressionSchema = createInsertSchema(compressions).pick({
  filename: true,
  originalSize: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertCompression = z.infer<typeof insertCompressionSchema>;
export type Compression = typeof compressions.$inferSelect;
