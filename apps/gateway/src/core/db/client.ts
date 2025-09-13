import { config } from '../../config';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import Database from 'better-sqlite3';
import { Pool } from 'pg';
import * as schema from './schema';
import path from 'node:path';
import fs from 'node:fs';
import { eq } from 'drizzle-orm';

export type DbClient = ReturnType<typeof drizzleSqlite> | ReturnType<typeof drizzlePg>;

function isPostgresUrl(url: string) {
  return url.startsWith('postgres://') || url.startsWith('postgresql://');
}

// Create a unified interface for database operations
export interface DatabaseOperations {
  users: {
    findByEmail: (email: string) => Promise<any | null>;
    findById: (id: string) => Promise<any | null>;
    create: (user: any) => Promise<any>;
    list: () => Promise<any[]>;
  };
  proxyRoutes: {
    list: (enabled?: boolean) => Promise<any[]>;
    findById: (id: string) => Promise<any | null>;
    create: (route: any) => Promise<any>;
    update: (id: string, route: any) => Promise<any>;
    delete: (id: string) => Promise<void>;
  };
}

class SqliteOperations implements DatabaseOperations {
  constructor(private db: ReturnType<typeof drizzleSqlite>) {}

  users = {
    findByEmail: async (email: string) => {
      const result = await this.db.select().from(schema.usersSqlite).where(eq(schema.usersSqlite.email, email));
      return result[0] || null;
    },
    findById: async (id: string) => {
      const result = await this.db.select().from(schema.usersSqlite).where(eq(schema.usersSqlite.id, id));
      return result[0] || null;
    },
    create: async (user: any) => {
      const result = await this.db.insert(schema.usersSqlite).values(user).returning();
      return result[0];
    },
    list: async () => {
      return await this.db.select().from(schema.usersSqlite);
    }
  };

  proxyRoutes = {
    list: async (enabled?: boolean) => {
      if (enabled !== undefined) {
        return await this.db.select().from(schema.proxyRoutesSqlite).where(eq(schema.proxyRoutesSqlite.enabled, enabled));
      }
      return await this.db.select().from(schema.proxyRoutesSqlite);
    },
    findById: async (id: string) => {
      const result = await this.db.select().from(schema.proxyRoutesSqlite).where(eq(schema.proxyRoutesSqlite.id, id));
      return result[0] || null;
    },
    create: async (route: any) => {
      const result = await this.db.insert(schema.proxyRoutesSqlite).values(route).returning();
      return result[0];
    },
    update: async (id: string, route: any) => {
      const result = await this.db.update(schema.proxyRoutesSqlite).set(route).where(eq(schema.proxyRoutesSqlite.id, id)).returning();
      return result[0];
    },
    delete: async (id: string) => {
      await this.db.delete(schema.proxyRoutesSqlite).where(eq(schema.proxyRoutesSqlite.id, id));
    }
  };
}

class PostgresOperations implements DatabaseOperations {
  constructor(private db: ReturnType<typeof drizzlePg>) {}

  users = {
    findByEmail: async (email: string) => {
      const result = await this.db.select().from(schema.usersPg).where(eq(schema.usersPg.email, email));
      return result[0] || null;
    },
    findById: async (id: string) => {
      const result = await this.db.select().from(schema.usersPg).where(eq(schema.usersPg.id, id));
      return result[0] || null;
    },
    create: async (user: any) => {
      const result = await this.db.insert(schema.usersPg).values(user).returning();
      return result[0];
    },
    list: async () => {
      return await this.db.select().from(schema.usersPg);
    }
  };

  proxyRoutes = {
    list: async (enabled?: boolean) => {
      if (enabled !== undefined) {
        return await this.db.select().from(schema.proxyRoutesPg).where(eq(schema.proxyRoutesPg.enabled, enabled));
      }
      return await this.db.select().from(schema.proxyRoutesPg);
    },
    findById: async (id: string) => {
      const result = await this.db.select().from(schema.proxyRoutesPg).where(eq(schema.proxyRoutesPg.id, id));
      return result[0] || null;
    },
    create: async (route: any) => {
      const result = await this.db.insert(schema.proxyRoutesPg).values(route).returning();
      return result[0];
    },
    update: async (id: string, route: any) => {
      const result = await this.db.update(schema.proxyRoutesPg).set(route).where(eq(schema.proxyRoutesPg.id, id)).returning();
      return result[0];
    },
    delete: async (id: string) => {
      await this.db.delete(schema.proxyRoutesPg).where(eq(schema.proxyRoutesPg.id, id));
    }
  };
}

export function createDb(): { db: DatabaseOperations; kind: 'sqlite' | 'pg' } {
  if (config.databaseUrl && isPostgresUrl(config.databaseUrl)) {
    const pool = new Pool({ connectionString: config.databaseUrl });
    const drizzleDb = drizzlePg(pool, { schema });
    return { db: new PostgresOperations(drizzleDb), kind: 'pg' as const };
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
      "order" INTEGER DEFAULT 0 NOT NULL,
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
  try {
    sqlite.exec(`ALTER TABLE proxy_routes ADD COLUMN "order" INTEGER DEFAULT 0 NOT NULL;`);
  } catch (e) {
    // ignore if column exists
  }
  const drizzleDb = drizzleSqlite(sqlite, { schema: { ...schema } });
  return { db: new SqliteOperations(drizzleDb), kind: 'sqlite' as const };
}

export type Schema = typeof schema;
export { schema };