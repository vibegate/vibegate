import { config } from '../../config';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import Database from 'better-sqlite3';
import { Pool } from 'pg';
import * as schema from './schema';
import path from 'node:path';
import fs from 'node:fs';
import { eq, sql } from 'drizzle-orm';

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
    update: (id: string, user: any) => Promise<any>;
    delete: (id: string) => Promise<void>;
    list: () => Promise<any[]>;
  };
  proxyRoutes: {
    list: (enabled?: boolean) => Promise<any[]>;
    findById: (id: string) => Promise<any | null>;
    create: (route: any) => Promise<any>;
    update: (id: string, route: any) => Promise<any>;
    delete: (id: string) => Promise<void>;
  };
  roles: {
    list: () => Promise<any[]>;
    findById: (id: string) => Promise<any | null>;
    findByName: (name: string) => Promise<any | null>;
    create: (role: any) => Promise<any>;
    update: (id: string, role: any) => Promise<any>;
    delete: (id: string) => Promise<void>;
  };
  userRoles: {
    getUserRoles: (userId: string) => Promise<any[]>;
    assignRole: (userId: string, roleId: string, assignedBy?: string) => Promise<void>;
    removeRole: (userId: string, roleId: string) => Promise<void>;
    getUsersWithRole: (roleId: string) => Promise<any[]>;
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
    update: async (id: string, user: any) => {
      const result = await this.db.update(schema.usersSqlite).set(user).where(eq(schema.usersSqlite.id, id)).returning();
      return result[0];
    },
    delete: async (id: string) => {
      await this.db.delete(schema.usersSqlite).where(eq(schema.usersSqlite.id, id));
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

  roles = {
    list: async () => {
      return await this.db.select().from(schema.rolesSqlite);
    },
    findById: async (id: string) => {
      const result = await this.db.select().from(schema.rolesSqlite).where(eq(schema.rolesSqlite.id, id));
      return result[0] || null;
    },
    findByName: async (name: string) => {
      const result = await this.db.select().from(schema.rolesSqlite).where(eq(schema.rolesSqlite.name, name));
      return result[0] || null;
    },
    create: async (role: any) => {
      const result = await this.db.insert(schema.rolesSqlite).values(role).returning();
      return result[0];
    },
    update: async (id: string, role: any) => {
      const result = await this.db.update(schema.rolesSqlite).set(role).where(eq(schema.rolesSqlite.id, id)).returning();
      return result[0];
    },
    delete: async (id: string) => {
      await this.db.delete(schema.rolesSqlite).where(eq(schema.rolesSqlite.id, id));
    }
  };

  userRoles = {
    getUserRoles: async (userId: string) => {
      const results = await this.db
        .select({
          roleId: schema.userRolesSqlite.roleId,
          role: schema.rolesSqlite
        })
        .from(schema.userRolesSqlite)
        .innerJoin(schema.rolesSqlite, eq(schema.userRolesSqlite.roleId, schema.rolesSqlite.id))
        .where(eq(schema.userRolesSqlite.userId, userId));
      return results.map(r => r.role);
    },
    assignRole: async (userId: string, roleId: string, assignedBy?: string) => {
      await this.db.insert(schema.userRolesSqlite).values({
        userId,
        roleId,
        assignedBy: assignedBy || null
      });
    },
    removeRole: async (userId: string, roleId: string) => {
      await this.db.delete(schema.userRolesSqlite)
        .where(
          sql`${schema.userRolesSqlite.userId} = ${userId} AND ${schema.userRolesSqlite.roleId} = ${roleId}`
        );
    },
    getUsersWithRole: async (roleId: string) => {
      const results = await this.db
        .select({
          userId: schema.userRolesSqlite.userId,
          user: schema.usersSqlite
        })
        .from(schema.userRolesSqlite)
        .innerJoin(schema.usersSqlite, eq(schema.userRolesSqlite.userId, schema.usersSqlite.id))
        .where(eq(schema.userRolesSqlite.roleId, roleId));
      return results.map(r => r.user);
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
    update: async (id: string, user: any) => {
      const result = await this.db.update(schema.usersPg).set(user).where(eq(schema.usersPg.id, id)).returning();
      return result[0];
    },
    delete: async (id: string) => {
      await this.db.delete(schema.usersPg).where(eq(schema.usersPg.id, id));
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

  roles = {
    list: async () => {
      return await this.db.select().from(schema.rolesPg);
    },
    findById: async (id: string) => {
      const result = await this.db.select().from(schema.rolesPg).where(eq(schema.rolesPg.id, id));
      return result[0] || null;
    },
    findByName: async (name: string) => {
      const result = await this.db.select().from(schema.rolesPg).where(eq(schema.rolesPg.name, name));
      return result[0] || null;
    },
    create: async (role: any) => {
      const result = await this.db.insert(schema.rolesPg).values(role).returning();
      return result[0];
    },
    update: async (id: string, role: any) => {
      const result = await this.db.update(schema.rolesPg).set(role).where(eq(schema.rolesPg.id, id)).returning();
      return result[0];
    },
    delete: async (id: string) => {
      await this.db.delete(schema.rolesPg).where(eq(schema.rolesPg.id, id));
    }
  };

  userRoles = {
    getUserRoles: async (userId: string) => {
      const results = await this.db
        .select({
          roleId: schema.userRolesPg.roleId,
          role: schema.rolesPg
        })
        .from(schema.userRolesPg)
        .innerJoin(schema.rolesPg, eq(schema.userRolesPg.roleId, schema.rolesPg.id))
        .where(eq(schema.userRolesPg.userId, userId));
      return results.map(r => r.role);
    },
    assignRole: async (userId: string, roleId: string, assignedBy?: string) => {
      await this.db.insert(schema.userRolesPg).values({
        userId,
        roleId,
        assignedBy: assignedBy || null
      });
    },
    removeRole: async (userId: string, roleId: string) => {
      await this.db.delete(schema.userRolesPg)
        .where(
          sql`${schema.userRolesPg.userId} = ${userId} AND ${schema.userRolesPg.roleId} = ${roleId}`
        );
    },
    getUsersWithRole: async (roleId: string) => {
      const results = await this.db
        .select({
          userId: schema.userRolesPg.userId,
          user: schema.usersPg
        })
        .from(schema.userRolesPg)
        .innerJoin(schema.usersPg, eq(schema.userRolesPg.userId, schema.usersPg.id))
        .where(eq(schema.userRolesPg.roleId, roleId));
      return results.map(r => r.user);
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
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      description TEXT,
      permissions TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
      updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      assigned_at INTEGER DEFAULT (unixepoch()) NOT NULL,
      assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      PRIMARY KEY (user_id, role_id)
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