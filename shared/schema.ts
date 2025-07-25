import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const swingAnalyses = pgTable("swing_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  videoPath: text("video_path").notNull(),
  title: text("title").notNull(),
  overallScore: real("overall_score").notNull(),
  overallFeedback: text("overall_feedback").notNull(),
  swingPhases: json("swing_phases").$type<SwingPhase[]>().notNull(),
  keyMetrics: json("key_metrics").$type<KeyMetric[]>().notNull(),
  recommendations: json("recommendations").$type<Recommendation[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SwingPhase = {
  name: string;
  timestamp: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
};

export type KeyMetric = {
  label: string;
  value: string;
  change?: string;
  changeDirection?: 'up' | 'down' | 'neutral';
};

export type Recommendation = {
  title: string;
  description: string;
  priority: 'High Impact' | 'Medium Impact' | 'Low Impact';
  category: string;
};

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSwingAnalysisSchema = createInsertSchema(swingAnalyses).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SwingAnalysis = typeof swingAnalyses.$inferSelect;
export type InsertSwingAnalysis = z.infer<typeof insertSwingAnalysisSchema>;
