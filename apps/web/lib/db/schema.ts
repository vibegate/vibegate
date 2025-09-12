import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 用户表
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  hashedPassword: text('hashed_password').notNull(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

// 代理路由表
export const proxyRoutes = sqliteTable('proxy_routes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  path: text('path').notNull().unique(),
  target: text('target').notNull(),
  requireAuth: integer('require_auth', { mode: 'boolean' })
    .notNull()
    .default(false),
  enabled: integer('enabled', { mode: 'boolean' })
    .notNull()
    .default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

// 类型导出
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ProxyRoute = typeof proxyRoutes.$inferSelect;
export type NewProxyRoute = typeof proxyRoutes.$inferInsert;