import jwt from 'jsonwebtoken';
import { config, isProduction } from '../config';
import type { FastifyReply, FastifyRequest } from 'fastify';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProduction(),
  path: '/',
  maxAge: 60 * 60 * 24 * 7 // 7 days
};

export function signToken(userId: string) {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
  return { userId: decoded.userId as string };
}

export function setAuthCookie(reply: FastifyReply, token: string) {
  reply.setCookie(config.cookieName, token, COOKIE_OPTS);
}

export function clearAuthCookie(reply: FastifyReply) {
  reply.clearCookie(config.cookieName, { path: '/' });
}

export function getTokenFromRequest(request: FastifyRequest): string | null {
  const cookie = request.cookies?.[config.cookieName];
  if (cookie) return cookie as string;
  const auth = request.headers['authorization'];
  if (auth && typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}
