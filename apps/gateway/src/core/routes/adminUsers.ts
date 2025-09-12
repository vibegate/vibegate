import type { FastifyInstance, FastifyRequest } from 'fastify';
import { createDb, schema } from '../db/client';
import { eq } from 'drizzle-orm';
import { getTokenFromRequest, verifyToken } from '../auth';

const { db, kind } = createDb();

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

export async function adminUsersRoutes(app: FastifyInstance) {
  const usersTable = kind === 'sqlite' ? schema.usersSqlite : schema.usersPg;

  // GET /vibegate/api/admin/users - list users (basic fields)
  app.get('/vibegate/api/admin/users', async (req, reply) => {
    try { await requireAdmin(req); } catch { return reply.code(403).send({ error: 'Forbidden' }); }

    const users = await db.select().from(usersTable);
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
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    const user = rows[0] as any;
    if (!user) return reply.code(404).send({ error: 'User not found' });
    const { hashedPassword, ...sanitized } = user;
    return reply.send({ user: sanitized });
  });
}
