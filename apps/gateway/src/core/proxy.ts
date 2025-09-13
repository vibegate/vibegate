import type { FastifyInstance } from 'fastify';
import { createDb } from './db/client';
import { getTokenFromRequest, verifyToken } from './auth';

const { db } = createDb();

type ProxyRoute = {
  id: string;
  path: string;
  target: string;
  requireAuth: boolean;
  enabled: boolean;
  order: number;
};

function sortByOrder(a: ProxyRoute, b: ProxyRoute) {
  // First sort by order (lower order = higher priority)
  if (a.order !== b.order) {
    return a.order - b.order;
  }
  // If order is the same, fallback to path length (longer path first for specificity)
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
  async function getRoutes(): Promise<ProxyRoute[]> {
    const now = Date.now();
    if (cache && now - cache.ts < TTL) return cache.routes;
    const rows = await db.proxyRoutes.list(true);
    const list = rows as ProxyRoute[];
    list.sort(sortByOrder);
    cache = { routes: list, ts: now };
    return list;
  }

  // Catch-all handler after API routes
  app.all('/*', async (req, reply) => {
    const routes = await getRoutes();
    const matched = routes.find(r => req.url.startsWith(r.path));
    if (!matched) {
      return reply.code(404).send({ error: 'No matching proxy route' });
    }

    let userInfo = null;
    if (matched.requireAuth) {
      const token = getTokenFromRequest(req);
      if (!token) {
        return reply.code(401).send({ error: 'Authentication required' });
      }
      try {
        const payload = verifyToken(token);
        const user = await db.users.findById(payload.userId);
        if (!user) {
          return reply.code(401).send({ error: 'User not found' });
        }
        userInfo = {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin
        };
      } catch (e) {
        return reply.code(401).send({ error: 'Invalid or expired token' });
      }
    }

    const rewritten = rewritePath(req.url, matched.path);
    const targetUrl = new URL(rewritten, matched.target);

    try {
      const headers: HeadersInit = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'content-length') {
          headers[key] = value as string;
        }
      }

      // Add user information header if user is authenticated
      if (userInfo) {
        headers['Vg-User'] = JSON.stringify(userInfo);
      }

      const response = await fetch(targetUrl.toString(), {
        method: req.method as string,
        headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' && req.body ?
          (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) : undefined,
        redirect: 'manual'
      });

      // Forward status code
      reply.code(response.status);

      // Forward headers
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'transfer-encoding') {
          reply.header(key, value);
        }
      });

      // Forward body
      const body = await response.text();
      return reply.send(body);
    } catch (error) {
      app.log.error('Proxy error:', error);
      return reply.code(502).send({ error: 'Bad gateway' });
    }
  });
}