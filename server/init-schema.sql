-- SQLite schema for Aurra AI
-- This creates the tables to match shared/schema.ts

CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  sess TEXT NOT NULL,
  expire TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  profile_image_url TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'free',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS style_profiles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  personality TEXT,
  body_type TEXT,
  color_preferences TEXT,
  style_preferences TEXT,
  clothing_items TEXT,
  lifestyle TEXT,
  budget TEXT,
  occasions TEXT,
  completed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outfits (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  occasion TEXT,
  items TEXT,
  ai_recommendation TEXT,
  image_url TEXT,
  dalle_url TEXT,
  is_favorite INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS style_collections (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  outfit_ids TEXT,
  is_public INTEGER DEFAULT 0,
  nft_minted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_points (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  level TEXT DEFAULT 'Beginner',
  total_earned INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shopping_analytics (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  outfit_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  search_query TEXT,
  clicked_at TEXT DEFAULT CURRENT_TIMESTAMP
);
