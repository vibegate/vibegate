import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createDb } from '../db/client';
import { getTokenFromRequest, verifyToken } from '../auth';

const { db } = createDb();

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  isAdmin: z.boolean().optional().default(false)
});

const UpdateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  isAdmin: z.boolean().optional()
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

export async function adminUsersRoutes(app: FastifyInstance) {
  // POST /vibegate/api/admin/users - create user
  app.post('/vibegate/api/admin/users', async (req, reply) => {
    try { await requireAdmin(req); } catch { return reply.code(403).send({ error: 'Forbidden' }); }

    const parsed = CreateUserSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload' });

    const { email, password, name, isAdmin } = parsed.data;

    // Check if user already exists
    const existing = await db.users.findByEmail(email);
    if (existing) return reply.code(409).send({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.users.create({
      email,
      hashedPassword,
      name: name || null,
      isAdmin
    });

    const { hashedPassword: _, ...sanitized } = user;
    return reply.code(201).send({ message: 'User created successfully', user: sanitized });
  });

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

  // PUT /vibegate/api/admin/users/:id - update user
  app.put('/vibegate/api/admin/users/:id', async (req, reply) => {
    try { await requireAdmin(req); } catch { return reply.code(403).send({ error: 'Forbidden' }); }

    const id = (req.params as any).id as string;
    const parsed = UpdateUserSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload' });

    // Check if user exists
    const existing = await db.users.findById(id);
    if (!existing) return reply.code(404).send({ error: 'User not found' });

    // Check if email is unique (if changing email)
    if (parsed.data.email && parsed.data.email !== existing.email) {
      const emailExists = await db.users.findByEmail(parsed.data.email);
      if (emailExists) return reply.code(409).send({ error: 'Email already exists' });
    }

    const updated = await db.users.update(id, parsed.data);
    if (!updated) return reply.code(500).send({ error: 'Failed to update user' });

    const { hashedPassword, ...sanitized } = updated;
    return reply.send({ message: 'User updated successfully', user: sanitized });
  });

  // DELETE /vibegate/api/admin/users/:id - delete user
  app.delete('/vibegate/api/admin/users/:id', async (req, reply) => {
    const currentUser = await requireAdmin(req).catch(() => null);
    if (!currentUser) return reply.code(403).send({ error: 'Forbidden' });

    const id = (req.params as any).id as string;

    // Prevent admin from deleting themselves
    if (id === currentUser.id) {
      return reply.code(400).send({ error: 'Cannot delete your own account' });
    }

    const existing = await db.users.findById(id);
    if (!existing) return reply.code(404).send({ error: 'User not found' });

    await db.users.delete(id);
    return reply.send({ message: 'User deleted successfully' });
  });
}