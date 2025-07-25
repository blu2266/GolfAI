import { 
  users, 
  swingAnalyses, 
  clubs, 
  userPreferences,
  promptConfigurations,
  type User, 
  type UpsertUser, 
  type SwingAnalysis, 
  type InsertSwingAnalysis,
  type Club,
  type InsertClub,
  type UserPreferences,
  type InsertUserPreferences,
  type PromptConfiguration,
  type InsertPromptConfiguration
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User management (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Swing analysis management
  createSwingAnalysis(analysis: InsertSwingAnalysis): Promise<SwingAnalysis>;
  getSwingAnalysis(id: string): Promise<SwingAnalysis | undefined>;
  getUserSwingAnalyses(userId?: string): Promise<SwingAnalysis[]>;
  getRecentSwingAnalyses(): Promise<SwingAnalysis[]>;
  getSavedSwingAnalysesByUser(userId: string): Promise<SwingAnalysis[]>;
  updateSwingAnalysis(id: string, updates: Partial<SwingAnalysis>): Promise<SwingAnalysis | undefined>;
  
  // Club management
  createClub(club: InsertClub): Promise<Club>;
  getClubsByUser(userId: string): Promise<Club[]>;
  getClub(id: string): Promise<Club | undefined>;
  updateClub(id: string, updates: Partial<Club>): Promise<Club | undefined>;
  deleteClub(id: string): Promise<boolean>;
  
  // User preferences
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  updateUserPreferences(userId: string, prefs: Partial<InsertUserPreferences>): Promise<UserPreferences>;
  
  // Prompt configurations (admin only)
  getActivePromptConfiguration(): Promise<PromptConfiguration | undefined>;
  getAllPromptConfigurations(): Promise<PromptConfiguration[]>;
  createPromptConfiguration(config: InsertPromptConfiguration): Promise<PromptConfiguration>;
  updatePromptConfiguration(id: string, updates: Partial<PromptConfiguration>): Promise<PromptConfiguration | undefined>;
  setActivePromptConfiguration(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values([userData])
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Swing analysis management
  async createSwingAnalysis(insertAnalysis: InsertSwingAnalysis): Promise<SwingAnalysis> {
    const [analysis] = await db
      .insert(swingAnalyses)
      .values([insertAnalysis])
      .returning();
    return analysis;
  }

  async getSwingAnalysis(id: string): Promise<SwingAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(swingAnalyses)
      .where(eq(swingAnalyses.id, id));
    return analysis || undefined;
  }

  async getUserSwingAnalyses(userId?: string): Promise<SwingAnalysis[]> {
    if (!userId) return [];
    return await db
      .select()
      .from(swingAnalyses)
      .where(eq(swingAnalyses.userId, userId))
      .orderBy(desc(swingAnalyses.createdAt));
  }

  async getRecentSwingAnalyses(): Promise<SwingAnalysis[]> {
    return await db
      .select()
      .from(swingAnalyses)
      .orderBy(desc(swingAnalyses.createdAt))
      .limit(5);
  }

  async getSavedSwingAnalysesByUser(userId: string): Promise<SwingAnalysis[]> {
    return await db
      .select()
      .from(swingAnalyses)
      .where(and(
        eq(swingAnalyses.userId, userId),
        eq(swingAnalyses.isSaved, true)
      ))
      .orderBy(desc(swingAnalyses.createdAt));
  }

  async updateSwingAnalysis(id: string, updates: Partial<SwingAnalysis>): Promise<SwingAnalysis | undefined> {
    const [analysis] = await db
      .update(swingAnalyses)
      .set(updates)
      .where(eq(swingAnalyses.id, id))
      .returning();
    return analysis || undefined;
  }

  // Club management
  async createClub(insertClub: InsertClub): Promise<Club> {
    const [club] = await db
      .insert(clubs)
      .values([insertClub])
      .returning();
    return club;
  }

  async getClubsByUser(userId: string): Promise<Club[]> {
    return await db
      .select()
      .from(clubs)
      .where(and(
        eq(clubs.userId, userId),
        eq(clubs.isActive, true)
      ))
      .orderBy(clubs.name);
  }

  async getClub(id: string): Promise<Club | undefined> {
    const [club] = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, id));
    return club || undefined;
  }

  async updateClub(id: string, updates: Partial<Club>): Promise<Club | undefined> {
    const [club] = await db
      .update(clubs)
      .set(updates)
      .where(eq(clubs.id, id))
      .returning();
    return club || undefined;
  }

  async deleteClub(id: string): Promise<boolean> {
    const result = await db
      .update(clubs)
      .set({ isActive: false })
      .where(eq(clubs.id, id))
      .returning();
    return result.length > 0;
  }

  // User preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return prefs || undefined;
  }

  async updateUserPreferences(userId: string, prefs: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(userId);
    
    if (existing) {
      const [updated] = await db
        .update(userPreferences)
        .set({ ...prefs, updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userPreferences)
        .values([{ ...prefs, userId }])
        .returning();
      return created;
    }
  }
  
  // Prompt configurations
  async getActivePromptConfiguration(): Promise<PromptConfiguration | undefined> {
    const [config] = await db
      .select()
      .from(promptConfigurations)
      .where(eq(promptConfigurations.isActive, true))
      .limit(1);
    return config;
  }
  
  async getAllPromptConfigurations(): Promise<PromptConfiguration[]> {
    return await db
      .select()
      .from(promptConfigurations)
      .orderBy(desc(promptConfigurations.createdAt));
  }
  
  async createPromptConfiguration(config: InsertPromptConfiguration): Promise<PromptConfiguration> {
    const [newConfig] = await db
      .insert(promptConfigurations)
      .values([config])
      .returning();
    return newConfig;
  }
  
  async updatePromptConfiguration(id: string, updates: Partial<PromptConfiguration>): Promise<PromptConfiguration | undefined> {
    const [updated] = await db
      .update(promptConfigurations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(promptConfigurations.id, id))
      .returning();
    return updated;
  }
  
  async setActivePromptConfiguration(id: string): Promise<void> {
    // First, deactivate all configurations
    await db
      .update(promptConfigurations)
      .set({ isActive: false });
    
    // Then activate the selected one
    await db
      .update(promptConfigurations)
      .set({ isActive: true })
      .where(eq(promptConfigurations.id, id));
  }
}

export const storage = new DatabaseStorage();