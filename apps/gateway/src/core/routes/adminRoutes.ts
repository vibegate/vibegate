import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { getTokenFromRequest, verifyToken } from '../auth';
import { createDb } from '../db/client';
import { invalidateProxyCache } from '../proxy';

const { db } = createDb();

const CreateRouteSchema = z.object({
  path: z.string().startsWith('/').min(1),
  target: z.string().url(),
  requireAuth: z.boolean().optional().default(false),
  enabled: z.boolean().optional().default(true),
  order: z.number().int().min(0).optional().default(0)
});

const UpdateRouteSchema = z.object({
  path: z.string().startsWith('/').min(1).optional(),
  target: z.string().url().optional(),
  requireAuth: z.boolean().optional(),
  enabled: z.boolean().optional(),
  order: z.number().int().min(0).optional()
});

const UpdateOrderSchema = z.object({
  routes: z.array(z.object({
    id: z.string(),
    order: z.number().int().min(0)
  }))
});

async function requireAuth(request: FastifyRequest) {
  const token = getTokenFromRequest(request);
  if (!token) throw new Error('Unauthorized');
  return verifyToken(token);
}

async function requireAdmin(request: FastifyRequest) {
  const { userId } = await requireAuth(request);
  const user = await db.users.findById(userId);
  if (!user || !user.isAdmin) throw new Error('Forbidden');
  return user;
}

export async function adminRoutes(app: FastifyInstance) {
  app.get('/vibegate/api/admin/routes', async (req, reply) => {
    try { await requireAdmin(req); } catch { return reply.code(403).send({ error: 'Forbidden' }); }

    const routes = await db.proxyRoutes.list();
    return reply.send({ routes });
  });

  app.post('/vibegate/api/admin/routes', async (req, reply) => {
    try { await requireAdmin(req); } catch { return reply.code(403).send({ error: 'Forbidden' }); }

    const parsed = CreateRouteSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload' });

    // Check if route already exists
    const routes = await db.proxyRoutes.list();
    const exists = routes.find((r: any) => r.path === parsed.data.path);
    if (exists) return reply.code(409).send({ error: 'Route already exists' });

    const created = await db.proxyRoutes.create(parsed.data);
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
      const routes = await db.proxyRoutes.list();
      const samePath = routes.find((r: any) => r.path === parsed.data.path && r.id !== id);
      if (samePath) return reply.code(409).send({ error: 'Route path already exists' });
    }

    const existing = await db.proxyRoutes.findById(id);
    if (!existing) return reply.code(404).send({ error: 'Route not found' });

    const updated = await db.proxyRoutes.update(id, parsed.data);
    invalidateProxyCache();
    return reply.send({ message: 'Route updated successfully', route: updated });
  });

  app.delete('/vibegate/api/admin/routes/:id', async (req, reply) => {
    try {
      await requireAuth(req);
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const id = (req.params as any).id as string;

    const existing = await db.proxyRoutes.findById(id);
    if (!existing) return reply.code(404).send({ error: 'Route not found' });

    await db.proxyRoutes.delete(id);
    invalidateProxyCache();
    return reply.send({ message: 'Route deleted successfully' });
  });

  app.put('/vibegate/api/admin/routes/order', async (req, reply) => {
    try { await requireAdmin(req); } catch { return reply.code(403).send({ error: 'Forbidden' }); }

    const parsed = UpdateOrderSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload' });

    // Update order for each route
    for (const routeOrder of parsed.data.routes) {
      const existing = await db.proxyRoutes.findById(routeOrder.id);
      if (existing) {
        await db.proxyRoutes.update(routeOrder.id, { order: routeOrder.order });
      }
    }

    invalidateProxyCache();
    return reply.send({ message: 'Route order updated successfully' });
  });
}