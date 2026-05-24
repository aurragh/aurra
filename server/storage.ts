import {
  users,
  styleProfiles,
  outfits,
  styleCollections,
  userPoints,
  shoppingAnalytics,
  pointTransactions,
  discountCodes,
  premiumTrials,
  freeOutfitCredits,
  wardrobeItems,
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
  type PointTransaction,
  type DiscountCode,
  type PremiumTrial,
  type FreeOutfitCredits,
  type WardrobeItem,
  type InsertWardrobeItem,
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, isNull, isNotNull, and, lt, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  updateUserSubscription(userId: string, status: string): Promise<User>;
  updateUserAvatarPhoto(userId: string, avatarPhotoUrl: string): Promise<User>;
  getOutfitByShareToken(token: string): Promise<Outfit | undefined>;
  setOutfitShareToken(id: string, userId: string, token: string): Promise<Outfit>;

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

  // Point redemption operations
  createPointTransaction(userId: string, type: string, action: string, points: number, description: string): Promise<PointTransaction>;
  getPointTransactions(userId: string): Promise<PointTransaction[]>;
  redeemPointsForOutfit(userId: string): Promise<{ success: boolean; message: string }>;
  redeemPointsForPremiumTrial(userId: string): Promise<{ success: boolean; message: string; expiresAt?: Date }>;
  redeemPointsForDiscount(userId: string): Promise<{ success: boolean; message: string; code?: string }>;
  getActivePremiumTrial(userId: string): Promise<PremiumTrial | undefined>;
  getActiveDiscountCode(userId: string): Promise<DiscountCode | undefined>;
  useDiscountCode(code: string): Promise<{ success: boolean; discountAmount: number }>;

  // Free outfit credits operations
  getFreeOutfitCredits(userId: string): Promise<number>;
  addFreeOutfitCredit(userId: string): Promise<void>;
  useFreeOutfitCredit(userId: string): Promise<boolean>;

  // Shopping analytics operations
  trackShoppingClick(analytics: InsertShoppingAnalytics): Promise<ShoppingAnalytics>;

  // Wardrobe operations
  getWardrobeItems(userId: string): Promise<WardrobeItem[]>;
  createWardrobeItem(item: InsertWardrobeItem): Promise<WardrobeItem>;
  deleteWardrobeItem(id: string, userId: string): Promise<void>;

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

  async updateUserSubscription(userId: string, status: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionStatus: status,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserAvatarPhoto(userId: string, avatarPhotoUrl: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ avatarPhotoUrl, updatedAt: sql`CURRENT_TIMESTAMP` })
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

  async getOutfitByShareToken(token: string): Promise<Outfit | undefined> {
    const [outfit] = await db
      .select()
      .from(outfits)
      .where(eq(outfits.shareToken, token));
    return outfit;
  }

  async setOutfitShareToken(id: string, userId: string, token: string): Promise<Outfit> {
    const [outfit] = await db
      .update(outfits)
      .set({ shareToken: token })
      .where(and(eq(outfits.id, id), eq(outfits.userId, userId)))
      .returning();
    return outfit;
  }

  async createOutfit(outfit: InsertOutfit): Promise<Outfit> {
    const [created] = await db
      .insert(outfits)
      .values({
        ...outfit,
        isFavorite: outfit.isFavorite ?? false,
        dalleUrl: outfit.dalleUrl ?? null,
        primaryRecommendation: outfit.primaryRecommendation ?? null,
        backupRecommendation: outfit.backupRecommendation ?? null,
        avoidRecommendation: outfit.avoidRecommendation ?? null,
        whyRecommendation: outfit.whyRecommendation ?? null
      })
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

  // Point redemption operations
  async createPointTransaction(userId: string, type: string, action: string, points: number, description: string): Promise<PointTransaction> {
    const [transaction] = await db
      .insert(pointTransactions)
      .values({ userId, type, action, points, description })
      .returning();
    return transaction;
  }

  async getPointTransactions(userId: string): Promise<PointTransaction[]> {
    return await db
      .select()
      .from(pointTransactions)
      .where(eq(pointTransactions.userId, userId))
      .orderBy(desc(pointTransactions.createdAt));
  }

  async redeemPointsForOutfit(userId: string): Promise<{ success: boolean; message: string }> {
    const COST = 50;
    const userPts = await this.getUserPoints(userId);

    if (!userPts || (userPts.points ?? 0) < COST) {
      return { success: false, message: `You need ${COST} points to redeem a free outfit. You have ${userPts?.points ?? 0} points.` };
    }

    // Deduct points
    await db
      .update(userPoints)
      .set({ points: (userPts.points ?? 0) - COST, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(userPoints.userId, userId));

    // Add a free outfit credit
    await this.addFreeOutfitCredit(userId);

    // Record transaction
    await this.createPointTransaction(userId, 'redeem', 'free_outfit', -COST, 'Redeemed for 1 free outfit generation');

    return { success: true, message: 'Successfully redeemed 50 points for a free outfit credit! Use it on your next outfit generation.' };
  }

  async redeemPointsForPremiumTrial(userId: string): Promise<{ success: boolean; message: string; expiresAt?: Date }> {
    const COST = 100;
    const userPts = await this.getUserPoints(userId);

    if (!userPts || (userPts.points ?? 0) < COST) {
      return { success: false, message: `You need ${COST} points for a 24-hour premium trial. You have ${userPts?.points ?? 0} points.` };
    }

    // Check if already has active trial
    const activeTrial = await this.getActivePremiumTrial(userId);
    if (activeTrial) {
      return { success: false, message: 'You already have an active premium trial.' };
    }

    // Deduct points
    await db
      .update(userPoints)
      .set({ points: (userPts.points ?? 0) - COST, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(userPoints.userId, userId));

    // Create premium trial (24 hours)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db
      .insert(premiumTrials)
      .values({ userId, expiresAt });

    // Record transaction
    await this.createPointTransaction(userId, 'redeem', 'premium_trial', -COST, 'Redeemed for 24-hour premium trial');

    return { success: true, message: 'Successfully unlocked premium features for 24 hours!', expiresAt };
  }

  async redeemPointsForDiscount(userId: string): Promise<{ success: boolean; message: string; code?: string }> {
    const COST = 200;
    const DISCOUNT_CENTS = 200; // $2 off
    const userPts = await this.getUserPoints(userId);

    if (!userPts || (userPts.points ?? 0) < COST) {
      return { success: false, message: `You need ${COST} points for a $2 discount. You have ${userPts?.points ?? 0} points.` };
    }

    // Check if already has unused discount code
    const existingCode = await this.getActiveDiscountCode(userId);
    if (existingCode) {
      return { success: false, message: `You already have an unused discount code: ${existingCode.code}` };
    }

    // Deduct points
    await db
      .update(userPoints)
      .set({ points: (userPts.points ?? 0) - COST, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(userPoints.userId, userId));

    // Generate unique code
    const code = `AURRA${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db
      .insert(discountCodes)
      .values({ userId, code, discountAmount: DISCOUNT_CENTS, expiresAt });

    // Record transaction
    await this.createPointTransaction(userId, 'redeem', 'discount_code', -COST, `Redeemed for $2 discount code: ${code}`);

    return { success: true, message: `Successfully generated discount code: ${code} ($2 off)`, code };
  }

  async getActivePremiumTrial(userId: string): Promise<PremiumTrial | undefined> {
    const [trial] = await db
      .select()
      .from(premiumTrials)
      .where(and(
        eq(premiumTrials.userId, userId),
        sql`${premiumTrials.expiresAt} > NOW()`
      ));
    return trial;
  }

  async getActiveDiscountCode(userId: string): Promise<DiscountCode | undefined> {
    const [code] = await db
      .select()
      .from(discountCodes)
      .where(and(
        eq(discountCodes.userId, userId),
        eq(discountCodes.used, false),
        sql`${discountCodes.expiresAt} > NOW()`
      ));
    return code;
  }

  async useDiscountCode(code: string): Promise<{ success: boolean; discountAmount: number }> {
    const [discountCode] = await db
      .select()
      .from(discountCodes)
      .where(and(
        eq(discountCodes.code, code),
        eq(discountCodes.used, false)
      ));

    if (!discountCode) {
      return { success: false, discountAmount: 0 };
    }

    if (discountCode.expiresAt && new Date(discountCode.expiresAt) < new Date()) {
      return { success: false, discountAmount: 0 };
    }

    await db
      .update(discountCodes)
      .set({ used: true })
      .where(eq(discountCodes.code, code));

    return { success: true, discountAmount: discountCode.discountAmount };
  }

  // Free outfit credits operations
  async getFreeOutfitCredits(userId: string): Promise<number> {
    const [record] = await db
      .select()
      .from(freeOutfitCredits)
      .where(eq(freeOutfitCredits.userId, userId));
    return record?.credits ?? 0;
  }

  async addFreeOutfitCredit(userId: string): Promise<void> {
    const existing = await this.getFreeOutfitCredits(userId);

    if (existing === 0) {
      // Check if record exists first
      const [record] = await db
        .select()
        .from(freeOutfitCredits)
        .where(eq(freeOutfitCredits.userId, userId));

      if (record) {
        await db
          .update(freeOutfitCredits)
          .set({ credits: 1, updatedAt: sql`CURRENT_TIMESTAMP` })
          .where(eq(freeOutfitCredits.userId, userId));
      } else {
        await db
          .insert(freeOutfitCredits)
          .values({ userId, credits: 1 });
      }
    } else {
      await db
        .update(freeOutfitCredits)
        .set({ credits: existing + 1, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(freeOutfitCredits.userId, userId));
    }
  }

  async useFreeOutfitCredit(userId: string): Promise<boolean> {
    const credits = await this.getFreeOutfitCredits(userId);

    if (credits <= 0) {
      return false;
    }

    await db
      .update(freeOutfitCredits)
      .set({ credits: credits - 1, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(freeOutfitCredits.userId, userId));

    return true;
  }

  // Wardrobe operations
  async getWardrobeItems(userId: string): Promise<WardrobeItem[]> {
    return await db
      .select()
      .from(wardrobeItems)
      .where(eq(wardrobeItems.userId, userId))
      .orderBy(desc(wardrobeItems.createdAt));
  }

  async createWardrobeItem(item: InsertWardrobeItem): Promise<WardrobeItem> {
    const [created] = await db.insert(wardrobeItems).values(item).returning();
    return created;
  }

  async deleteWardrobeItem(id: string, userId: string): Promise<void> {
    await db
      .delete(wardrobeItems)
      .where(and(eq(wardrobeItems.id, id), eq(wardrobeItems.userId, userId)));
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
