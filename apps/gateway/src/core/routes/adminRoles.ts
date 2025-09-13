import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createDb } from '../db/client';
import { getTokenFromRequest, verifyToken } from '../auth';

const { db } = createDb();

const CreateRoleSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/, 'Role name must be lowercase alphanumeric with _ or -'),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([])
});

const UpdateRoleSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional()
});

const AssignRoleSchema = z.object({
  roleId: z.string()
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

export async function adminRolesRoutes(app: FastifyInstance) {
  // GET /vibegate/api/admin/roles - list all roles
  app.get('/vibegate/api/admin/roles', async (req, reply) => {
    try { await requireAdmin(req); } catch { return reply.code(403).send({ error: 'Forbidden' }); }

    const roles = await db.roles.list();
    const sanitized = roles.map((r: any) => ({
      ...r,
      permissions: JSON.parse(r.permissions || '[]')
    }));
    return reply.send({ roles: sanitized });
  });

  // GET /vibegate/api/admin/roles/:id - get role details
  app.get('/vibegate/api/admin/roles/:id', async (req, reply) => {
    try { await requireAdmin(req); } catch { return reply.code(403).send({ error: 'Forbidden' }); }

    const id = (req.params as any).id as string;
    const role = await db.roles.findById(id);
    if (!role) return reply.code(404).send({ error: 'Role not found' });

    return reply.send({
      role: {
        ...role,
        permissions: JSON.parse(role.permissions || '[]')
      }
    });
  });

  // POST /vibegate/api/admin/roles - create role
  app.post('/vibegate/api/admin/roles', async (req, reply) => {
    try { await requireAdmin(req); } catch { return reply.code(403).send({ error: 'Forbidden' }); }

    const parsed = CreateRoleSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload', details: parsed.error.flatten() });

    const { name, displayName, description, permissions } = parsed.data;

    // Check if role name already exists
    const existing = await db.roles.findByName(name);
    if (existing) return reply.code(409).send({ error: 'Role name already exists' });

    const role = await db.roles.create({
      name,
      displayName,
      description: description || null,
      permissions: JSON.stringify(permissions)
    });

    return reply.code(201).send({
      message: 'Role created successfully',
      role: {
        ...role,
        permissions: JSON.parse(role.permissions || '[]')
      }
    });
  });

  // PUT /vibegate/api/admin/roles/:id - update role
  app.put('/vibegate/api/admin/roles/:id', async (req, reply) => {
    try { await requireAdmin(req); } catch { return reply.code(403).send({ error: 'Forbidden' }); }

    const id = (req.params as any).id as string;
    const parsed = UpdateRoleSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload', details: parsed.error.flatten() });

    // Check if role exists
    const existing = await db.roles.findById(id);
    if (!existing) return reply.code(404).send({ error: 'Role not found' });

    const updateData: any = {};
    if (parsed.data.displayName !== undefined) updateData.displayName = parsed.data.displayName;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.permissions !== undefined) updateData.permissions = JSON.stringify(parsed.data.permissions);

    const updated = await db.roles.update(id, updateData);
    if (!updated) return reply.code(500).send({ error: 'Failed to update role' });

    return reply.send({
      message: 'Role updated successfully',
      role: {
        ...updated,
        permissions: JSON.parse(updated.permissions || '[]')
      }
    });
  });

  // DELETE /vibegate/api/admin/roles/:id - delete role
  app.delete('/vibegate/api/admin/roles/:id', async (req, reply) => {
    try { await requireAdmin(req); } catch { return reply.code(403).send({ error: 'Forbidden' }); }

    const id = (req.params as any).id as string;

    const existing = await db.roles.findById(id);
    if (!existing) return reply.code(404).send({ error: 'Role not found' });

    // Check if any users have this role
    const usersWithRole = await db.userRoles.getUsersWithRole(id);
    if (usersWithRole.length > 0) {
      return reply.code(400).send({
        error: 'Cannot delete role',
        message: `${usersWithRole.length} users have this role assigned`
      });
    }

    await db.roles.delete(id);
    return reply.send({ message: 'Role deleted successfully' });
  });

  // GET /vibegate/api/admin/users/:userId/roles - get user's roles
  app.get('/vibegate/api/admin/users/:userId/roles', async (req, reply) => {
    try { await requireAdmin(req); } catch { return reply.code(403).send({ error: 'Forbidden' }); }

    const userId = (req.params as any).userId as string;

    const user = await db.users.findById(userId);
    if (!user) return reply.code(404).send({ error: 'User not found' });

    const roles = await db.userRoles.getUserRoles(userId);
    const sanitized = roles.map((r: any) => ({
      ...r,
      permissions: JSON.parse(r.permissions || '[]')
    }));

    return reply.send({ roles: sanitized });
  });

  // POST /vibegate/api/admin/users/:userId/roles - assign role to user
  app.post('/vibegate/api/admin/users/:userId/roles', async (req, reply) => {
    const admin = await requireAdmin(req).catch(() => null);
    if (!admin) return reply.code(403).send({ error: 'Forbidden' });

    const userId = (req.params as any).userId as string;
    const parsed = AssignRoleSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid payload' });

    const { roleId } = parsed.data;

    // Check if user exists
    const user = await db.users.findById(userId);
    if (!user) return reply.code(404).send({ error: 'User not found' });

    // Check if role exists
    const role = await db.roles.findById(roleId);
    if (!role) return reply.code(404).send({ error: 'Role not found' });

    // Check if user already has this role
    const userRoles = await db.userRoles.getUserRoles(userId);
    if (userRoles.some((r: any) => r.id === roleId)) {
      return reply.code(409).send({ error: 'User already has this role' });
    }

    await db.userRoles.assignRole(userId, roleId, admin.id);
    return reply.send({ message: 'Role assigned successfully' });
  });

  // DELETE /vibegate/api/admin/users/:userId/roles/:roleId - remove role from user
  app.delete('/vibegate/api/admin/users/:userId/roles/:roleId', async (req, reply) => {
    try { await requireAdmin(req); } catch { return reply.code(403).send({ error: 'Forbidden' }); }

    const userId = (req.params as any).userId as string;
    const roleId = (req.params as any).roleId as string;

    // Check if user exists
    const user = await db.users.findById(userId);
    if (!user) return reply.code(404).send({ error: 'User not found' });

    // Check if user has this role
    const userRoles = await db.userRoles.getUserRoles(userId);
    if (!userRoles.some((r: any) => r.id === roleId)) {
      return reply.code(404).send({ error: 'User does not have this role' });
    }

    await db.userRoles.removeRole(userId, roleId);
    return reply.send({ message: 'Role removed successfully' });
  });
}