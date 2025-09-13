import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { setAuthCookie, signToken, verifyToken, clearAuthCookie, getTokenFromRequest } from '../auth';
import { createDb } from '../db/client';

const { db } = createDb();

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

    // Check if any admin exists already
    const users = await db.users.list();
    const existingAdmin = users.find((u: any) => u.isAdmin);
    if (existingAdmin) {
      return reply.code(403).send({ error: 'Admin already exists' });
    }

    // Prevent duplicate email
    const existing = await db.users.findByEmail(email);
    if (existing) {
      return reply.code(409).send({ error: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await db.users.create({ 
      email, 
      hashedPassword: hashed, 
      name: name ?? null, 
      isAdmin: true 
    });

    const token = signToken(user.id);
    setAuthCookie(reply, token);
    const { hashedPassword, ...sanitized } = user;
    return { user: sanitized, token };
  });

  // Regular user registration
  app.post('/vibegate/api/auth/register', async (req, reply) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid payload' });
    }
    const { email, password, name } = parsed.data;

    // Check if user already exists
    const existing = await db.users.findByEmail(email);
    if (existing) {
      return reply.code(409).send({ error: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    
    // First user becomes admin if no admins exist
    const users = await db.users.list();
    const hasAdmin = users.some((u: any) => u.isAdmin);
    
    const user = await db.users.create({ 
      email, 
      hashedPassword: hashed, 
      name: name ?? null,
      isAdmin: !hasAdmin
    });

    const token = signToken(user.id);
    setAuthCookie(reply, token);
    const { hashedPassword, ...sanitized } = user;
    return { user: sanitized, token };
  });

  // Login
  app.post('/vibegate/api/auth/login', async (req, reply) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid payload' });
    }
    const { email, password } = parsed.data;

    const user = await db.users.findByEmail(email);
    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const token = signToken(user.id);
    setAuthCookie(reply, token);
    const { hashedPassword, ...sanitized } = user;
    return { user: sanitized, token };
  });

  // Logout
  app.post('/vibegate/api/auth/logout', async (_req, reply) => {
    clearAuthCookie(reply);
    return { success: true };
  });

  // Get current user
  app.get('/vibegate/api/auth/me', async (req, reply) => {
    const token = getTokenFromRequest(req);
    if (!token) {
      return reply.code(401).send({ error: 'Not authenticated' });
    }

    try {
      const payload = verifyToken(token);
      const user = await db.users.findById(payload.userId);
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }
      const { hashedPassword, ...sanitized } = user;
      return { user: sanitized };
    } catch (e) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }
  });
}