import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use SQLite for local persistence (works around disabled Neon database)
const dbPath = path.join(__dirname, '..', 'aurra.db');
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });