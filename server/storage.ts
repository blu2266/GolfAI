import { type User, type InsertUser, type SwingAnalysis, type InsertSwingAnalysis } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createSwingAnalysis(analysis: InsertSwingAnalysis): Promise<SwingAnalysis>;
  getSwingAnalysis(id: string): Promise<SwingAnalysis | undefined>;
  getUserSwingAnalyses(userId?: string): Promise<SwingAnalysis[]>;
  getRecentSwingAnalyses(): Promise<SwingAnalysis[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private swingAnalyses: Map<string, SwingAnalysis>;

  constructor() {
    this.users = new Map();
    this.swingAnalyses = new Map();
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

  async createSwingAnalysis(insertAnalysis: InsertSwingAnalysis): Promise<SwingAnalysis> {
    const id = randomUUID();
    const analysis: SwingAnalysis = {
      id,
      userId: insertAnalysis.userId || null,
      videoPath: insertAnalysis.videoPath,
      title: insertAnalysis.title,
      overallScore: insertAnalysis.overallScore,
      overallFeedback: insertAnalysis.overallFeedback,
      swingPhases: insertAnalysis.swingPhases,
      keyMetrics: insertAnalysis.keyMetrics,
      recommendations: insertAnalysis.recommendations,
      createdAt: new Date(),
    };
    this.swingAnalyses.set(id, analysis);
    return analysis;
  }

  async getSwingAnalysis(id: string): Promise<SwingAnalysis | undefined> {
    return this.swingAnalyses.get(id);
  }

  async getUserSwingAnalyses(userId?: string): Promise<SwingAnalysis[]> {
    if (!userId) return [];
    return Array.from(this.swingAnalyses.values())
      .filter(analysis => analysis.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getRecentSwingAnalyses(): Promise<SwingAnalysis[]> {
    return Array.from(this.swingAnalyses.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }
}

export const storage = new MemStorage();
