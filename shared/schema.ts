import { sql } from 'drizzle-orm';
import {
  index,
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: text("expire").notNull(),
  }
);

// User storage table.
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("free"), // free, premium, pro
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const styleProfiles = sqliteTable("style_profiles", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").notNull(),
  personality: text("personality"), // JSON string of personality traits
  bodyType: text("body_type"),
  colorPreferences: text("color_preferences"), // JSON array
  stylePreferences: text("style_preferences"), // JSON array
  clothingItems: text("clothing_items"), // JSON array of clothing items needing help
  lifestyle: text("lifestyle"), // JSON object
  budget: text("budget"),
  occasions: text("occasions"), // JSON array
  completed: integer("completed", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const outfits = sqliteTable("outfits", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  occasion: text("occasion"),
  items: text("items"), // JSON array of clothing items
  aiRecommendation: text("ai_recommendation"), // AI analysis and reasoning
  imageUrl: text("image_url"), // Local path for displaying images
  dalleUrl: text("dalle_url"), // Original DALL-E URL for GPT-4 Vision
  isFavorite: integer("is_favorite", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  deletedAt: text("deleted_at"), // For soft delete functionality
});

export const styleCollections = sqliteTable("style_collections", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  outfitIds: text("outfit_ids"), // JSON array of outfit IDs
  isPublic: integer("is_public", { mode: "boolean" }).default(false),
  nftMinted: integer("nft_minted", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const userPoints = sqliteTable("user_points", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").notNull(),
  points: integer("points").default(0),
  level: text("level").default("Beginner"), // Beginner, Intermediate, Advanced, Expert
  totalEarned: integer("total_earned").default(0),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const shoppingAnalytics = sqliteTable("shopping_analytics", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  userId: text("user_id").notNull(),
  outfitId: text("outfit_id").notNull(),
  itemName: text("item_name").notNull(),
  searchQuery: text("search_query"),
  clickedAt: text("clicked_at").default(sql`CURRENT_TIMESTAMP`),
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
