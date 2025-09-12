import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { and, desc, eq } from 'drizzle-orm';
import { setAuthCookie, signToken, verifyToken, clearAuthCookie, getTokenFromRequest } from '../auth';
import { createDb } from '../db/client';
import { schema } from '../db/client';

const { db, kind } = createDb();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function authRoutes(app: FastifyInstance) {
  // Bootstrap an admin when none exists yet
  app.post('/vibegate/api/auth/bootstrap-admin', async (req, reply) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid payload' });
    }
    const { email, password, name } = parsed.data;

    const table = kind === 'sqlite' ? schema.usersSqlite : schema.usersPg;
    // If any admin exists already, disallow
    const existingAdmin = await db
      .select()
      .from(table)
      .where(eq(table.isAdmin as any, true as any))
      .limit(1);
    if (existingAdmin.length > 0) {
      return reply.code(403).send({ error: 'Admin already exists' });
    }

    // Prevent duplicate email
    const existing = await db
      .select()
      .from(table)
      .where(eq(table.email, email))
      .limit(1);
    if (existing.length > 0) {
      return reply.code(409).send({ error: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(table)
      .values({ email, hashedPassword: hashed, name: name ?? null, isAdmin: true as any })
      .returning();

    const token = signToken((user as any).id);
    setAuthCookie(reply, token);
    const { hashedPassword, ...sanitized } = user as any;
    return reply.code(201).send({ message: 'Admin created successfully', user: sanitized });
  });

  app.post('/vibegate/api/auth/register', async (req, reply) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid payload' });
    }
    const { email, password, name } = parsed.data;

    const existing = await db.select().from(kind === 'sqlite' ? schema.usersSqlite : schema.usersPg)
      .where(eq((kind === 'sqlite' ? schema.usersSqlite.email : schema.usersPg.email), email))
      .limit(1);
    if (existing.length > 0) {
      return reply.code(409).send({ error: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const table = kind === 'sqlite' ? schema.usersSqlite : schema.usersPg;
    const anyUser = await db.select().from(table).limit(1);
    const [user] = await db
      .insert(table)
      .values({ email, hashedPassword: hashed, name: name ?? null, isAdmin: anyUser.length === 0 })
      .returning();
    const token = signToken(user.id);
    setAuthCookie(reply, token);
    const { hashedPassword, ...sanitized } = user as any;
    return reply.code(201).send({ message: 'User registered successfully', user: sanitized });
  });

  app.post('/vibegate/api/auth/login', async (req, reply) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid payload' });
    }
    const { email, password } = parsed.data;
    const table = kind === 'sqlite' ? schema.usersSqlite : schema.usersPg;
    const users = await db.select().from(table)
      .where(eq(table.email, email)).limit(1);
    const user = users[0];
    if (!user) return reply.code(401).send({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, (user as any).hashedPassword);
    if (!ok) return reply.code(401).send({ error: 'Invalid credentials' });
    const token = signToken((user as any).id);
    setAuthCookie(reply, token);
    const { hashedPassword, ...sanitized } = user as any;
    return reply.send({ message: 'Login successful', user: sanitized });
  });

  app.post('/vibegate/api/auth/logout', async (_req, reply) => {
    clearAuthCookie(reply);
    return reply.send({ message: 'Logged out' });
  });

  app.get('/vibegate/api/auth/me', async (req, reply) => {
    const token = getTokenFromRequest(req);
    if (!token) return reply.code(401).send({ error: 'Unauthorized' });
    try {
      const { userId } = verifyToken(token);
      const table = kind === 'sqlite' ? schema.usersSqlite : schema.usersPg;
      const users = await db.select().from(table).where(eq(table.id, userId)).limit(1);
      const user = users[0];
      if (!user) return reply.code(404).send({ error: 'User not found' });
      const { hashedPassword, ...sanitized } = user as any;
      return reply.send({ user: sanitized });
    } catch (e) {
      return reply.code(401).send({ error: 'Invalid token' });
    }
  });
}
