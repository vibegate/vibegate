import type { FastifyInstance } from 'fastify';
import { createDb, schema } from './db/client';
import { eq } from 'drizzle-orm';
import { getTokenFromRequest, verifyToken } from './auth';

const { db, kind } = createDb();

type ProxyRoute = {
  id: string;
  path: string;
  target: string;
  requireAuth: boolean;
  enabled: boolean;
};

function sortBySpecificity(a: ProxyRoute, b: ProxyRoute) {
  // longer path first
  return b.path.length - a.path.length;
}

function rewritePath(originalPath: string, basePath: string) {
  if (originalPath.startsWith(basePath)) {
    const rest = originalPath.slice(basePath.length);
    return rest.length > 0 ? rest : '/';
  }
  return originalPath;
}

let cache: { routes: ProxyRoute[]; ts: number } | null = null;
const TTL = 5000;

export function invalidateProxyCache() {
  cache = null;
}

export async function proxyRoutes(app: FastifyInstance) {
  const table = kind === 'sqlite' ? schema.proxyRoutesSqlite : schema.proxyRoutesPg;

  async function getRoutes(): Promise<ProxyRoute[]> {
    const now = Date.now();
    if (cache && now - cache.ts < TTL) return cache.routes;
    const rows = await db.select().from(table).where(eq(table.enabled, true));
    const list = rows as unknown as ProxyRoute[];
    list.sort(sortBySpecificity);
    cache = { routes: list, ts: now };
    return list;
  }

  // Catch-all handler after API routes
  app.all('/*', async (req, reply) => {
    const url = req.url; // includes path + query
    const [pathname, qs] = url.split('?');
    const routes = await getRoutes();
    const match = routes.find(r => pathname.startsWith(r.path));
    if (!match) return reply.code(404).send({ error: 'No route matched' });

    if (match.requireAuth) {
      const token = getTokenFromRequest(req);
      if (!token) return reply.code(401).send({ error: 'Unauthorized' });
      try {
        verifyToken(token);
      } catch {
        return reply.code(401).send({ error: 'Invalid token' });
      }
    }

    const upstreamPath = rewritePath(pathname, match.path);
    const targetUrl = `${match.target}${upstreamPath}${qs ? `?${qs}` : ''}`;

    // Prepare headers (remove hop-by-hop and host)
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (!v) continue;
      const key = k.toLowerCase();
      if (['connection', 'host', 'content-length'].includes(key)) continue;
      // Fastify may give string | string[]; normalize to string
      headers[key] = Array.isArray(v) ? v.join(', ') : String(v);
    }

    // Prepare body for non-GET/HEAD
    let body: any = undefined;
    const method = req.method.toUpperCase();
    if (!['GET', 'HEAD'].includes(method)) {
      const ct = headers['content-type'] || '';
      const parsed = (req as any).body;
      if (parsed == null) {
        body = undefined;
      } else if (typeof parsed === 'string' || parsed instanceof Uint8Array || Buffer.isBuffer(parsed)) {
        body = parsed as any;
      } else if (ct.includes('application/json')) {
        body = JSON.stringify(parsed);
        if (!headers['content-type']) headers['content-type'] = 'application/json';
      } else {
        // Fallback serialize
        body = JSON.stringify(parsed);
        headers['content-type'] = 'application/json';
      }
    }

    const res = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    // Relay status and headers
    reply.status(res.status);
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'transfer-encoding') return;
      reply.header(key, value);
    });

    const buf = Buffer.from(await res.arrayBuffer());
    return reply.send(buf);
  });
}
