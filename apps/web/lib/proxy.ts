import { db, proxyRoutes } from './db';
import { eq } from 'drizzle-orm';
import { verifyToken } from './auth';

export interface ProxyRoute {
  id: string;
  path: string;
  target: string;
  requireAuth: boolean;
  enabled: boolean;
}

// 缓存代理路由，避免频繁查询数据库
let routesCache: ProxyRoute[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5秒缓存

export async function getProxyRoutes(): Promise<ProxyRoute[]> {
  const now = Date.now();
  
  if (routesCache && (now - cacheTimestamp) < CACHE_TTL) {
    return routesCache;
  }

  const routes = await db
    .select()
    .from(proxyRoutes)
    .where(eq(proxyRoutes.enabled, true))
    .orderBy(proxyRoutes.path); // 按路径排序

  routesCache = routes;
  cacheTimestamp = now;
  
  return routes;
}

export function clearRoutesCache() {
  routesCache = null;
  cacheTimestamp = 0;
}

export function matchRoute(pathname: string, routes: ProxyRoute[]): ProxyRoute | null {
  // 查找匹配的路由
  for (const route of routes) {
    if (pathname.startsWith(route.path)) {
      return route;
    }
  }
  return null;
}

export function isAuthRequired(route: ProxyRoute): boolean {
  return route.requireAuth;
}

export function validateAuth(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  
  try {
    verifyToken(token);
    return true;
  } catch {
    return false;
  }
}

export function rewritePath(pathname: string, route: ProxyRoute): string {
  // 移除匹配的路径前缀
  return pathname.slice(route.path.length) || '/';
}