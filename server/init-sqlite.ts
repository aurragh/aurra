import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initializeSQLite() {
  try {
    const dbPath = path.join(__dirname, '..', 'aurra.db');
    const sqlite = new Database(dbPath);
    
    // Read and execute the entire schema SQL at once
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'init-schema.sql'), 'utf-8');
    
    // Execute all SQL statements at once
    sqlite.exec(schemaSQL);
    
    // Verify tables were created
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('✅ SQLite database initialized. Tables:', tables.map((t: any) => t.name).join(', '));
    
    sqlite.close();
  } catch (error) {
    console.error('❌ Error initializing SQLite:', error);
    throw error;
  }
}
