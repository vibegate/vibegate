import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
}

export async function withAuth(
  req: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authorization header required' },
      { status: 401 }
    );
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token);
    (req as AuthenticatedRequest).userId = decoded.userId;
    return handler(req as AuthenticatedRequest);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}