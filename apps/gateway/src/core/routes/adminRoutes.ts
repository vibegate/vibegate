import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { and, desc, eq, ne } from 'drizzle-orm';
import { getTokenFromRequest, verifyToken } from '../auth';
import { createDb, schema } from '../db/client';
import { invalidateProxyCache } from '../proxy';

const { db, kind } = createDb();

const CreateRouteSchema = z.object({
  path: z.string().startsWith('/').min(1),
  target: z.string().url(),
  requireAuth: z.boolean().optional().default(false),
  enabled: z.boolean().optional().default(true)
});

const UpdateRouteSchema = z.object({
  path: z.string().startsWith('/').min(1).optional(),
  target: z.string().url().optional(),
  requireAuth: z.boolean().optional(),
  enabled: z.boolean().optional()
});

async function requireAuth(request: FastifyRequest) {
  const token = getTokenFromRequest(request);
  if (!token) throw new Error('Unauthorized');
  return verifyToken(token);
}

async function requireAdmin(request: FastifyRequest) {
  const { userId } = await requireAuth(request);
  const usersTable = kind === 'sqlite' ? schema.usersSqlite : schema.usersPg;
  const rows = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const user = rows[0] as any;
  if (!user || !user.isAdmin) throw new Error('Forbidden');
  return user;
}

export async function adminRoutes(app: FastifyInstance) {
  const table = kind === 'sqlite' ? schema.proxyRoutesSqlite : schema.proxyRoutesPg;

  app.get('/vibegate/api/admin/routes', async (req, reply) => {
    try { await requireAdmin(req); } catch { return reply.code(403).send({ error: 'Forbidden' }); }

    const rows = await db.select().from(table).orderBy(table.createdAt);
    return reply.send({ routes: rows });
  });

  app.post('/vibegate/api/admin/routes', async (req, reply) => {
    try { await requireAdmin(req); } catch { return reply.code(403).send({ error: 'Forbidden' }); }

    const parsed = CreateRouteSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload' });

    const exists = await db.select().from(table).where(eq(table.path, parsed.data.path)).limit(1);
    if (exists.length > 0) return reply.code(409).send({ error: 'Route already exists' });

    const [created] = await db.insert(table).values(parsed.data).returning();
    invalidateProxyCache();
    return reply.code(201).send({ message: 'Route created successfully', route: created });
  });

  app.put('/vibegate/api/admin/routes/:id', async (req, reply) => {
    try { await requireAdmin(req); } catch { return reply.code(403).send({ error: 'Forbidden' }); }

    const id = (req.params as any).id as string;
    const parsed = UpdateRouteSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload' });

    // ensure unique path if updating path
    if (parsed.data.path) {
      const samePath = await db.select().from(table).where(and(eq(table.path, parsed.data.path), ne(table.id, id))).limit(1);
      if (samePath.length > 0) return reply.code(409).send({ error: 'Route path already exists' });
    }

    const updated = await db.update(table).set(parsed.data as any).where(eq(table.id, id)).returning();
    if (updated.length === 0) return reply.code(404).send({ error: 'Route not found' });
    invalidateProxyCache();
    return reply.send({ message: 'Route updated successfully', route: updated[0] });
  });

  app.delete('/vibegate/api/admin/routes/:id', async (req, reply) => {
    try {
      await requireAuth(req);
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const id = (req.params as any).id as string;
    const deleted = await db.delete(table).where(eq(table.id, id)).returning();
    if (deleted.length === 0) return reply.code(404).send({ error: 'Route not found' });
    invalidateProxyCache();
    return reply.send({ message: 'Route deleted successfully' });
  });
}
