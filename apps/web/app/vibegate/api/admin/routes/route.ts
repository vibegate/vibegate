import { NextRequest, NextResponse } from 'next/server';
import { db, proxyRoutes } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

// GET /vibegate/api/admin/routes - 获取所有代理路由
export async function GET(req: NextRequest) {
  return withAuth(req, async (authReq: AuthenticatedRequest) => {
    try {
      const routes = await db
        .select()
        .from(proxyRoutes)
        .orderBy(proxyRoutes.createdAt);

      return NextResponse.json({ routes });
    } catch (error) {
      console.error('Get routes error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

// POST /vibegate/api/admin/routes - 创建新的代理路由
export async function POST(req: NextRequest) {
  return withAuth(req, async (authReq: AuthenticatedRequest) => {
    try {
      const { path, target, requireAuth, enabled } = await req.json();

      if (!path || !target) {
        return NextResponse.json(
          { error: 'Path and target are required' },
          { status: 400 }
        );
      }

      // 检查路径是否已存在
      const existingRoute = await db
        .select()
        .from(proxyRoutes)
        .where(eq(proxyRoutes.path, path))
        .get();

      if (existingRoute) {
        return NextResponse.json(
          { error: 'Route with this path already exists' },
          { status: 409 }
        );
      }

      const [route] = await db
        .insert(proxyRoutes)
        .values({
          path,
          target,
          requireAuth: requireAuth ?? false,
          enabled: enabled ?? true
        })
        .returning();

      return NextResponse.json(
        { message: 'Route created successfully', route },
        { status: 201 }
      );
    } catch (error) {
      console.error('Create route error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}