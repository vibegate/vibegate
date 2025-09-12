import { config } from '../../config';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import Database from 'better-sqlite3';
import { Pool } from 'pg';
import * as schema from './schema';
import path from 'node:path';
import fs from 'node:fs';

export type DbClient = ReturnType<typeof drizzleSqlite> | ReturnType<typeof drizzlePg>;

function isPostgresUrl(url: string) {
  return url.startsWith('postgres://') || url.startsWith('postgresql://');
}

export function createDb() {
  if (config.databaseUrl && isPostgresUrl(config.databaseUrl)) {
    const pool = new Pool({ connectionString: config.databaseUrl });
    const db = drizzlePg(pool, { schema });
    return { db, kind: 'pg' as const };
  }

  // default to local sqlite file under apps/gateway/data
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const sqlite = new Database(path.join(dataDir, 'vibegate.db'));
  sqlite.pragma('journal_mode = WAL');
  // ensure tables exist (dev convenience)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      hashed_password TEXT NOT NULL,
      name TEXT,
      is_admin INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
      updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS proxy_routes (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL UNIQUE,
      target TEXT NOT NULL,
      require_auth INTEGER DEFAULT 0 NOT NULL,
      enabled INTEGER DEFAULT 1 NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
      updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
    );
    -- attempt to add missing columns (older dev DBs)
    -- try to add is_admin for older databases
    -- will fail with duplicate column error if already exists; ignore at runtime
  `);
  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0 NOT NULL;`);
  } catch (e) {
    // ignore if column exists
  }
  const db = drizzleSqlite(sqlite, { schema: { ...schema } });
  return { db, kind: 'sqlite' as const };
}

export type Schema = typeof schema;
export { schema };
