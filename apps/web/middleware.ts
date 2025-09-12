import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 暂时禁用中间件代理功能，只处理基本路由
  return NextResponse.next();
}

export const config = {
  matcher: [],  // 暂时不匹配任何路径
};