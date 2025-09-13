import { sql } from 'drizzle-orm';
import { pgTable, text as pgText, boolean as pgBoolean, timestamp as pgTimestamp, integer as pgInteger } from 'drizzle-orm/pg-core';
import { sqliteTable, text as sqliteText, integer as sqliteInteger } from 'drizzle-orm/sqlite-core';

// We define dual schemas for portability across SQLite and Postgres.

// SQLite schema
export const usersSqlite = sqliteTable('users', {
  id: sqliteText('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: sqliteText('email').notNull().unique(),
  hashedPassword: sqliteText('hashed_password').notNull(),
  name: sqliteText('name'),
  isAdmin: sqliteInteger('is_admin', { mode: 'boolean' }).notNull().default(false),
  createdAt: sqliteInteger('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: sqliteInteger('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`).$onUpdate(() => new Date())
});

export const proxyRoutesSqlite = sqliteTable('proxy_routes', {
  id: sqliteText('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  path: sqliteText('path').notNull().unique(),
  target: sqliteText('target').notNull(),
  requireAuth: sqliteInteger('require_auth', { mode: 'boolean' }).notNull().default(false),
  enabled: sqliteInteger('enabled', { mode: 'boolean' }).notNull().default(true),
  order: sqliteInteger('order').notNull().default(0),
  createdAt: sqliteInteger('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: sqliteInteger('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`).$onUpdate(() => new Date())
});

// Postgres schema
export const usersPg = pgTable('users', {
  id: pgText('id').primaryKey().default(sql`gen_random_uuid()::text`),
  email: pgText('email').notNull().unique(),
  hashedPassword: pgText('hashed_password').notNull(),
  name: pgText('name'),
  isAdmin: pgBoolean('is_admin').notNull().default(false),
  createdAt: pgTimestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: pgTimestamp('updated_at', { withTimezone: false }).notNull().defaultNow()
});

export const proxyRoutesPg = pgTable('proxy_routes', {
  id: pgText('id').primaryKey().default(sql`gen_random_uuid()::text`),
  path: pgText('path').notNull().unique(),
  target: pgText('target').notNull(),
  requireAuth: pgBoolean('require_auth').notNull().default(false),
  enabled: pgBoolean('enabled').notNull().default(true),
  order: pgInteger('order').notNull().default(0),
  createdAt: pgTimestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: pgTimestamp('updated_at', { withTimezone: false }).notNull().defaultNow()
});

export type UserSqlite = typeof usersSqlite.$inferSelect;
export type NewUserSqlite = typeof usersSqlite.$inferInsert;
export type ProxyRouteSqlite = typeof proxyRoutesSqlite.$inferSelect;
export type NewProxyRouteSqlite = typeof proxyRoutesSqlite.$inferInsert;

export type UserPg = typeof usersPg.$inferSelect;
export type NewUserPg = typeof usersPg.$inferInsert;
export type ProxyRoutePg = typeof proxyRoutesPg.$inferSelect;
export type NewProxyRoutePg = typeof proxyRoutesPg.$inferInsert;
