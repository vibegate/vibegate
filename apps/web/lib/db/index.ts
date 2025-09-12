import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// 确保数据目录存在
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
const sqlite = new Database(path.join(dataDir, 'vibegate.db'));

// 启用 WAL 模式以提高并发性能
sqlite.pragma('journal_mode = WAL');

// 创建 Drizzle 实例
export const db = drizzle(sqlite, { schema });

// 导出 schema
export * from './schema';

// 初始化数据库表
export function initDatabase() {
  // 创建用户表
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      hashed_password TEXT NOT NULL,
      name TEXT,
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
      updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
    )
  `);

  // 创建代理路由表
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS proxy_routes (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL UNIQUE,
      target TEXT NOT NULL,
      require_auth INTEGER DEFAULT 0 NOT NULL,
      enabled INTEGER DEFAULT 1 NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
      updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
    )
  `);
}

// 初始化数据库
initDatabase();