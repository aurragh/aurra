import {
  users,
  styleProfiles,
  outfits,
  styleCollections,
  userPoints,
  shoppingAnalytics,
  type User,
  type UpsertUser,
  type StyleProfile,
  type InsertStyleProfile,
  type Outfit,
  type InsertOutfit,
  type StyleCollection,
  type InsertCollection,
  type UserPoints,
  type ShoppingAnalytics,
  type InsertShoppingAnalytics,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, isNull, isNotNull, and, lt, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  
  // Style profile operations
  getStyleProfile(userId: string): Promise<StyleProfile | undefined>;
  createOrUpdateStyleProfile(profile: InsertStyleProfile): Promise<StyleProfile>;
  
  // Outfit operations
  getUserOutfits(userId: string): Promise<Outfit[]>;
  getUserDeletedOutfits(userId: string): Promise<Outfit[]>;
  getOutfit(id: string, userId: string): Promise<Outfit | undefined>;
  createOutfit(outfit: InsertOutfit): Promise<Outfit>;
  updateOutfit(id: string, updates: Partial<InsertOutfit>): Promise<Outfit>;
  updateOutfitImage(id: string, imageUrl: string, dalleUrl?: string): Promise<Outfit>;
  deleteOutfit(id: string): Promise<void>; // Soft delete
  permanentlyDeleteOutfit(id: string): Promise<void>; // Hard delete
  restoreOutfit(id: string): Promise<Outfit>;
  cleanupOldDeletedOutfits(): Promise<void>; // Remove outfits deleted over 30 days ago
  toggleFavoriteOutfit(id: string): Promise<Outfit>;
  
  // Collection operations
  getUserCollections(userId: string): Promise<StyleCollection[]>;
  createCollection(collection: InsertCollection): Promise<StyleCollection>;
  updateCollection(id: string, updates: Partial<InsertCollection>): Promise<StyleCollection>;
  deleteCollection(id: string): Promise<void>;
  
  // Points operations
  getUserPoints(userId: string): Promise<UserPoints | undefined>;
  updateUserPoints(userId: string, pointsToAdd: number): Promise<UserPoints>;
  initializeUserPoints(userId: string): Promise<UserPoints>;
  
  // Shopping analytics operations
  trackShoppingClick(analytics: InsertShoppingAnalytics): Promise<ShoppingAnalytics>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllOutfits(): Promise<Outfit[]>;
  getAdminStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionStatus: "premium",
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Style profile operations
  async getStyleProfile(userId: string): Promise<StyleProfile | undefined> {
    const [profile] = await db
      .select()
      .from(styleProfiles)
      .where(eq(styleProfiles.userId, userId));
    return profile;
  }

  async createOrUpdateStyleProfile(profile: InsertStyleProfile): Promise<StyleProfile> {
    const existing = await this.getStyleProfile(profile.userId);
    
    if (existing) {
      const [updated] = await db
        .update(styleProfiles)
        .set({
          ...profile,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(styleProfiles.userId, profile.userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(styleProfiles)
        .values(profile)
        .returning();
      return created;
    }
  }

  // Outfit operations
  async getUserOutfits(userId: string): Promise<Outfit[]> {
    return await db
      .select()
      .from(outfits)
      .where(and(
        eq(outfits.userId, userId),
        isNull(outfits.deletedAt)
      ))
      .orderBy(desc(outfits.createdAt));
  }

  async getUserDeletedOutfits(userId: string): Promise<Outfit[]> {
    return await db
      .select()
      .from(outfits)
      .where(and(
        eq(outfits.userId, userId),
        isNotNull(outfits.deletedAt)
      ))
      .orderBy(desc(outfits.deletedAt));
  }

  async getOutfit(id: string, userId: string): Promise<Outfit | undefined> {
    const [outfit] = await db
      .select()
      .from(outfits)
      .where(and(
        eq(outfits.id, id),
        eq(outfits.userId, userId)
      ));
    return outfit;
  }

  async createOutfit(outfit: InsertOutfit): Promise<Outfit> {
    const [created] = await db
      .insert(outfits)
      .values(outfit)
      .returning();
    return created;
  }

  async updateOutfit(id: string, updates: Partial<InsertOutfit>): Promise<Outfit> {
    const [updated] = await db
      .update(outfits)
      .set(updates)
      .where(eq(outfits.id, id))
      .returning();
    return updated;
  }

  async updateOutfitImage(id: string, imageUrl: string, dalleUrl?: string): Promise<Outfit> {
    const updateData: any = { imageUrl };
    if (dalleUrl) {
      updateData.dalleUrl = dalleUrl;
    }
    const [updated] = await db
      .update(outfits)
      .set(updateData)
      .where(eq(outfits.id, id))
      .returning();
    return updated;
  }

  async deleteOutfit(id: string): Promise<void> {
    // Soft delete by setting deletedAt timestamp
    await db
      .update(outfits)
      .set({ deletedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(outfits.id, id));
  }

  async permanentlyDeleteOutfit(id: string): Promise<void> {
    // Hard delete - actually remove from database
    await db.delete(outfits).where(eq(outfits.id, id));
  }

  async restoreOutfit(id: string): Promise<Outfit> {
    // Restore soft deleted outfit by clearing deletedAt
    const [restored] = await db
      .update(outfits)
      .set({ deletedAt: null })
      .where(eq(outfits.id, id))
      .returning();
    return restored;
  }

  async cleanupOldDeletedOutfits(): Promise<void> {
    // Delete outfits that were soft deleted over 30 days ago
    await db
      .delete(outfits)
      .where(and(
        isNotNull(outfits.deletedAt),
        sql`datetime(${outfits.deletedAt}) < datetime('now', '-30 days')`
      ));
  }

  async toggleFavoriteOutfit(id: string): Promise<Outfit> {
    const [outfit] = await db.select().from(outfits).where(eq(outfits.id, id));
    const [updated] = await db
      .update(outfits)
      .set({ isFavorite: !outfit.isFavorite })
      .where(eq(outfits.id, id))
      .returning();
    return updated;
  }

  // Collection operations
  async getUserCollections(userId: string): Promise<StyleCollection[]> {
    return await db
      .select()
      .from(styleCollections)
      .where(eq(styleCollections.userId, userId))
      .orderBy(desc(styleCollections.createdAt));
  }

  async createCollection(collection: InsertCollection): Promise<StyleCollection> {
    const [created] = await db
      .insert(styleCollections)
      .values(collection)
      .returning();
    return created;
  }

  async updateCollection(id: string, updates: Partial<InsertCollection>): Promise<StyleCollection> {
    const [updated] = await db
      .update(styleCollections)
      .set(updates)
      .where(eq(styleCollections.id, id))
      .returning();
    return updated;
  }

  async deleteCollection(id: string): Promise<void> {
    await db.delete(styleCollections).where(eq(styleCollections.id, id));
  }

  // Points operations
  async getUserPoints(userId: string): Promise<UserPoints | undefined> {
    const [points] = await db
      .select()
      .from(userPoints)
      .where(eq(userPoints.userId, userId));
    return points;
  }

  async updateUserPoints(userId: string, pointsToAdd: number): Promise<UserPoints> {
    const existing = await this.getUserPoints(userId);
    
    if (existing) {
      const newPoints = (existing.points ?? 0) + pointsToAdd;
      const newTotal = (existing.totalEarned ?? 0) + pointsToAdd;
      let newLevel = existing.level;
      
      // Level progression
      if (newTotal >= 10000) newLevel = "Expert";
      else if (newTotal >= 5000) newLevel = "Advanced";
      else if (newTotal >= 1000) newLevel = "Intermediate";
      
      const [updated] = await db
        .update(userPoints)
        .set({
          points: newPoints,
          totalEarned: newTotal,
          level: newLevel,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(userPoints.userId, userId))
        .returning();
      return updated;
    } else {
      return await this.initializeUserPoints(userId);
    }
  }

  async initializeUserPoints(userId: string): Promise<UserPoints> {
    const [created] = await db
      .insert(userPoints)
      .values({
        userId,
        points: 100, // Welcome bonus
        totalEarned: 100,
        level: "Beginner",
      })
      .returning();
    return created;
  }

  // Shopping analytics operations
  async trackShoppingClick(analytics: InsertShoppingAnalytics): Promise<ShoppingAnalytics> {
    const [created] = await db
      .insert(shoppingAnalytics)
      .values(analytics)
      .returning();
    return created;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async getAllOutfits(): Promise<Outfit[]> {
    return await db
      .select()
      .from(outfits)
      .orderBy(desc(outfits.createdAt));
  }

  async getAdminStats(): Promise<any> {
    const totalUsers = await db.select().from(users);
    const totalOutfits = await db.select().from(outfits);
    const premiumUsers = totalUsers.filter(u => u.subscriptionStatus && u.subscriptionStatus !== 'free');
    
    return {
      totalUsers: totalUsers.length,
      totalOutfits: totalOutfits.length,
      premiumUsers: premiumUsers.length,
      conversionRate: totalUsers.length > 0 ? (premiumUsers.length / totalUsers.length) * 100 : 0,
      estimatedRevenue: premiumUsers.length * 9.99
    };
  }
}

export const storage = new DatabaseStorage();
