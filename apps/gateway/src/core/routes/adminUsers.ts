import type { FastifyInstance, FastifyRequest } from 'fastify';
import { createDb } from '../db/client';
import { getTokenFromRequest, verifyToken } from '../auth';

const { db } = createDb();

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

export async function adminUsersRoutes(app: FastifyInstance) {
  // GET /vibegate/api/admin/users - list users (basic fields)
  app.get('/vibegate/api/admin/users', async (req, reply) => {
    try { await requireAdmin(req); } catch { return reply.code(403).send({ error: 'Forbidden' }); }

    const users = await db.users.list();
    const sanitized = users.map((u: any) => {
      const { hashedPassword, ...rest } = u;
      return rest;
    });
    return reply.send({ users: sanitized });
  });

  // GET /vibegate/api/admin/users/:id - user detail
  app.get('/vibegate/api/admin/users/:id', async (req, reply) => {
    try { await requireAdmin(req); } catch { return reply.code(403).send({ error: 'Forbidden' }); }

    const id = (req.params as any).id as string;
    const user = await db.users.findById(id);
    if (!user) return reply.code(404).send({ error: 'User not found' });
    const { hashedPassword, ...sanitized } = user;
    return reply.send({ user: sanitized });
  });
}