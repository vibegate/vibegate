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

// Roles table for SQLite
export const rolesSqlite = sqliteTable('roles', {
  id: sqliteText('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: sqliteText('name').notNull().unique(),
  displayName: sqliteText('display_name').notNull(),
  description: sqliteText('description'),
  permissions: sqliteText('permissions').notNull().default('[]'), // JSON array stored as text
  createdAt: sqliteInteger('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: sqliteInteger('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`).$onUpdate(() => new Date())
});

// User-Roles junction table for SQLite
export const userRolesSqlite = sqliteTable('user_roles', {
  userId: sqliteText('user_id').notNull().references(() => usersSqlite.id, { onDelete: 'cascade' }),
  roleId: sqliteText('role_id').notNull().references(() => rolesSqlite.id, { onDelete: 'cascade' }),
  assignedAt: sqliteInteger('assigned_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  assignedBy: sqliteText('assigned_by').references(() => usersSqlite.id, { onDelete: 'set null' })
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

// Roles table for PostgreSQL
export const rolesPg = pgTable('roles', {
  id: pgText('id').primaryKey().default(sql`gen_random_uuid()::text`),
  name: pgText('name').notNull().unique(),
  displayName: pgText('display_name').notNull(),
  description: pgText('description'),
  permissions: pgText('permissions').notNull().default('[]'), // JSON array stored as text
  createdAt: pgTimestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: pgTimestamp('updated_at', { withTimezone: false }).notNull().defaultNow()
});

// User-Roles junction table for PostgreSQL
export const userRolesPg = pgTable('user_roles', {
  userId: pgText('user_id').notNull().references(() => usersPg.id, { onDelete: 'cascade' }),
  roleId: pgText('role_id').notNull().references(() => rolesPg.id, { onDelete: 'cascade' }),
  assignedAt: pgTimestamp('assigned_at', { withTimezone: false }).notNull().defaultNow(),
  assignedBy: pgText('assigned_by').references(() => usersPg.id, { onDelete: 'set null' })
});

export type UserSqlite = typeof usersSqlite.$inferSelect;
export type NewUserSqlite = typeof usersSqlite.$inferInsert;
export type ProxyRouteSqlite = typeof proxyRoutesSqlite.$inferSelect;
export type NewProxyRouteSqlite = typeof proxyRoutesSqlite.$inferInsert;
export type RoleSqlite = typeof rolesSqlite.$inferSelect;
export type NewRoleSqlite = typeof rolesSqlite.$inferInsert;
export type UserRoleSqlite = typeof userRolesSqlite.$inferSelect;
export type NewUserRoleSqlite = typeof userRolesSqlite.$inferInsert;

export type UserPg = typeof usersPg.$inferSelect;
export type NewUserPg = typeof usersPg.$inferInsert;
export type ProxyRoutePg = typeof proxyRoutesPg.$inferSelect;
export type NewProxyRoutePg = typeof proxyRoutesPg.$inferInsert;
export type RolePg = typeof rolesPg.$inferSelect;
export type NewRolePg = typeof rolesPg.$inferInsert;
export type UserRolePg = typeof userRolesPg.$inferSelect;
export type NewUserRolePg = typeof userRolesPg.$inferInsert;
