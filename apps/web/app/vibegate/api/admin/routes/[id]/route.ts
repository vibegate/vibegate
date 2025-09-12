import { NextRequest, NextResponse } from 'next/server';
import { db, proxyRoutes } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

// PUT /vibegate/api/admin/routes/[id] - 更新代理路由
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (authReq: AuthenticatedRequest) => {
    try {
      const { id } = params;
      const { path, target, requireAuth, enabled } = await req.json();

      const existingRoute = await db
        .select()
        .from(proxyRoutes)
        .where(eq(proxyRoutes.id, id))
        .get();

      if (!existingRoute) {
        return NextResponse.json(
          { error: 'Route not found' },
          { status: 404 }
        );
      }

      // 如果路径改变，检查新路径是否已存在
      if (path && path !== existingRoute.path) {
        const conflictingRoute = await db
          .select()
          .from(proxyRoutes)
          .where(eq(proxyRoutes.path, path))
          .get();

        if (conflictingRoute) {
          return NextResponse.json(
            { error: 'Route with this path already exists' },
            { status: 409 }
          );
        }
      }

      const updateData: any = {};
      if (path !== undefined) updateData.path = path;
      if (target !== undefined) updateData.target = target;
      if (requireAuth !== undefined) updateData.requireAuth = requireAuth;
      if (enabled !== undefined) updateData.enabled = enabled;

      const [route] = await db
        .update(proxyRoutes)
        .set(updateData)
        .where(eq(proxyRoutes.id, id))
        .returning();

      return NextResponse.json({
        message: 'Route updated successfully',
        route
      });
    } catch (error) {
      console.error('Update route error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

// DELETE /vibegate/api/admin/routes/[id] - 删除代理路由
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async (authReq: AuthenticatedRequest) => {
    try {
      const { id } = params;

      const existingRoute = await db
        .select()
        .from(proxyRoutes)
        .where(eq(proxyRoutes.id, id))
        .get();

      if (!existingRoute) {
        return NextResponse.json(
          { error: 'Route not found' },
          { status: 404 }
        );
      }

      await db
        .delete(proxyRoutes)
        .where(eq(proxyRoutes.id, id));

      return NextResponse.json({
        message: 'Route deleted successfully'
      });
    } catch (error) {
      console.error('Delete route error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}