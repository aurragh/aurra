import { sql } from 'drizzle-orm';
import {
  index,
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("free"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const styleProfiles = pgTable("style_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  personality: text("personality"),
  bodyType: varchar("body_type"),
  colorPreferences: text("color_preferences"),
  stylePreferences: text("style_preferences"),
  clothingItems: text("clothing_items"),
  lifestyle: text("lifestyle"),
  budget: varchar("budget"),
  occasions: text("occasions"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const outfits = pgTable("outfits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  occasion: varchar("occasion"),
  items: text("items"),
  aiRecommendation: text("ai_recommendation"),
  primaryRecommendation: text("primary_recommendation"),
  backupRecommendation: text("backup_recommendation"),
  avoidRecommendation: text("avoid_recommendation"),
  whyRecommendation: text("why_recommendation"),
  imageUrl: varchar("image_url"),
  dalleUrl: varchar("dalle_url"),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const styleCollections = pgTable("style_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  outfitIds: text("outfit_ids"),
  isPublic: boolean("is_public").default(false),
  nftMinted: boolean("nft_minted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPoints = pgTable("user_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  points: integer("points").default(0),
  level: varchar("level").default("Beginner"),
  totalEarned: integer("total_earned").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shoppingAnalytics = pgTable("shopping_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  outfitId: varchar("outfit_id").notNull(),
  itemName: varchar("item_name").notNull(),
  searchQuery: text("search_query"),
  clickedAt: timestamp("clicked_at").defaultNow(),
});

export const pointTransactions = pgTable("point_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(), // 'earn' or 'redeem'
  action: varchar("action").notNull(), // 'quiz_complete', 'outfit_generated', 'free_outfit', 'premium_trial', 'discount_code'
  points: integer("points").notNull(), // positive for earn, negative for redeem
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const discountCodes = pgTable("discount_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  code: varchar("code").notNull().unique(),
  discountAmount: integer("discount_amount").notNull(), // in cents
  used: boolean("used").default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const premiumTrials = pgTable("premium_trials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const freeOutfitCredits = pgTable("free_outfit_credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  credits: integer("credits").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ one, many }) => ({
  styleProfile: one(styleProfiles, {
    fields: [users.id],
    references: [styleProfiles.userId],
  }),
  outfits: many(outfits),
  collections: many(styleCollections),
  points: one(userPoints, {
    fields: [users.id],
    references: [userPoints.userId],
  }),
}));

export const styleProfileRelations = relations(styleProfiles, ({ one }) => ({
  user: one(users, {
    fields: [styleProfiles.userId],
    references: [users.id],
  }),
}));

export const outfitRelations = relations(outfits, ({ one }) => ({
  user: one(users, {
    fields: [outfits.userId],
    references: [users.id],
  }),
}));

export const collectionRelations = relations(styleCollections, ({ one }) => ({
  user: one(users, {
    fields: [styleCollections.userId],
    references: [users.id],
  }),
}));

export const pointsRelations = relations(userPoints, ({ one }) => ({
  user: one(users, {
    fields: [userPoints.userId],
    references: [users.id],
  }),
}));

export const shoppingAnalyticsRelations = relations(shoppingAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [shoppingAnalytics.userId],
    references: [users.id],
  }),
  outfit: one(outfits, {
    fields: [shoppingAnalytics.outfitId],
    references: [outfits.id],
  }),
}));

export const pointTransactionsRelations = relations(pointTransactions, ({ one }) => ({
  user: one(users, {
    fields: [pointTransactions.userId],
    references: [users.id],
  }),
}));

export const discountCodesRelations = relations(discountCodes, ({ one }) => ({
  user: one(users, {
    fields: [discountCodes.userId],
    references: [users.id],
  }),
}));

export const premiumTrialsRelations = relations(premiumTrials, ({ one }) => ({
  user: one(users, {
    fields: [premiumTrials.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertStyleProfileSchema = createInsertSchema(styleProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOutfitSchema = createInsertSchema(outfits).omit({
  id: true,
  createdAt: true,
});

export const insertCollectionSchema = createInsertSchema(styleCollections).omit({
  id: true,
  createdAt: true,
});

export const insertShoppingAnalyticsSchema = createInsertSchema(shoppingAnalytics).omit({
  id: true,
  clickedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type StyleProfile = typeof styleProfiles.$inferSelect;
export type InsertStyleProfile = z.infer<typeof insertStyleProfileSchema>;
export type Outfit = typeof outfits.$inferSelect;
export type InsertOutfit = z.infer<typeof insertOutfitSchema>;
export type StyleCollection = typeof styleCollections.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type UserPoints = typeof userPoints.$inferSelect;
export type ShoppingAnalytics = typeof shoppingAnalytics.$inferSelect;
export type InsertShoppingAnalytics = z.infer<typeof insertShoppingAnalyticsSchema>;
export type PointTransaction = typeof pointTransactions.$inferSelect;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type PremiumTrial = typeof premiumTrials.$inferSelect;
export type FreeOutfitCredits = typeof freeOutfitCredits.$inferSelect;
