import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { hashPassword, generateToken, sanitizeUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // 检查用户是否已存在
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    const hashedPasswordValue = await hashPassword(password);

    // 创建新用户
    const [user] = await db
      .insert(users)
      .values({
        email,
        hashedPassword: hashedPasswordValue,
        name: name || null
      })
      .returning();

    const token = generateToken(user.id);
    const sanitized = sanitizeUser(user);

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: sanitized,
        token 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}