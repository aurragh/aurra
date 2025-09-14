import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("free"), // free, premium, pro
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const styleProfiles = pgTable("style_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  personality: text("personality"), // JSON string of personality traits
  bodyType: varchar("body_type"),
  colorPreferences: text("color_preferences"), // JSON array
  stylePreferences: text("style_preferences"), // JSON array
  lifestyle: text("lifestyle"), // JSON object
  budget: varchar("budget"),
  occasions: text("occasions"), // JSON array
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
  items: text("items"), // JSON array of clothing items
  aiRecommendation: text("ai_recommendation"), // AI analysis and reasoning
  imageUrl: varchar("image_url"),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const styleCollections = pgTable("style_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  outfitIds: text("outfit_ids"), // JSON array of outfit IDs
  isPublic: boolean("is_public").default(false),
  nftMinted: boolean("nft_minted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPoints = pgTable("user_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  points: integer("points").default(0),
  level: varchar("level").default("Beginner"), // Beginner, Intermediate, Advanced, Expert
  totalEarned: integer("total_earned").default(0),
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
