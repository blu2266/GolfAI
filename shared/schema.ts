import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, timestamp, integer, real, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI provider settings for admin control
export const aiSettings = pgTable("ai_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull().default("gemini"), // "gemini" or "openai"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

// Prompt configurations table for admin control over AI prompts
export const promptConfigurations = pgTable("prompt_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  prompt: text("prompt").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const clubs = pgTable("clubs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // driver, wood, hybrid, iron, wedge, putter
  brand: text("brand"),
  model: text("model"),
  loft: real("loft"),
  shaft: text("shaft"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  defaultClubId: varchar("default_club_id").references(() => clubs.id),
  units: text("units").default("yards").notNull(), // yards or meters
  handicap: real("handicap"),
  playingGoals: text("playing_goals"),
  practiceFrequency: text("practice_frequency"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  ballMetrics: json("ball_metrics").$type<BallMetrics>(),
  frameExtractions: json("frame_extractions").$type<FrameExtraction[]>(),
  clubId: varchar("club_id").references(() => clubs.id),
  isSaved: boolean("is_saved").default(false).notNull(),
  notes: text("notes"),
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

export type BallMetrics = {
  ballSpeed?: string;
  estimatedDistance?: string;
  launchAngle?: string;
  hangTime?: string;
  curve?: string;
};

export type Recommendation = {
  title: string;
  description: string;
  priority: 'High Impact' | 'Medium Impact' | 'Low Impact';
  category: string;
};

export type FrameExtraction = {
  timestamp: string;
  framePath: string;
};

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertSwingAnalysisSchema = createInsertSchema(swingAnalyses).omit({
  id: true,
  createdAt: true,
});

export const insertClubSchema = createInsertSchema(clubs).omit({
  id: true,
  createdAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPromptConfigurationSchema = createInsertSchema(promptConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAISettingsSchema = createInsertSchema(aiSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports for Replit Auth
export type User = typeof users.$inferSelect;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SwingAnalysis = typeof swingAnalyses.$inferSelect;
export type InsertSwingAnalysis = z.infer<typeof insertSwingAnalysisSchema>;
export type Club = typeof clubs.$inferSelect;
export type InsertClub = z.infer<typeof insertClubSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type PromptConfiguration = typeof promptConfigurations.$inferSelect;
export type InsertPromptConfiguration = z.infer<typeof insertPromptConfigurationSchema>;
export type AISettings = typeof aiSettings.$inferSelect;
export type InsertAISettings = z.infer<typeof insertAISettingsSchema>;

// Define relationships
export const userRelations = relations(users, ({ many, one }) => ({
  swingAnalyses: many(swingAnalyses),
  clubs: many(clubs),
  preferences: one(userPreferences),
}));

export const swingAnalysesRelations = relations(swingAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [swingAnalyses.userId],
    references: [users.id],
  }),
  club: one(clubs, {
    fields: [swingAnalyses.clubId],
    references: [clubs.id],
  }),
}));

export const clubsRelations = relations(clubs, ({ one, many }) => ({
  user: one(users, {
    fields: [clubs.userId],
    references: [users.id],
  }),
  swingAnalyses: many(swingAnalyses),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
  defaultClub: one(clubs, {
    fields: [userPreferences.defaultClubId],
    references: [clubs.id],
  }),
}));

// Club types
export const CLUB_TYPES = [
  'driver',
  'fairway_wood',
  'hybrid',
  'iron',
  'wedge',
  'putter'
] as const;

export type ClubType = typeof CLUB_TYPES[number];
