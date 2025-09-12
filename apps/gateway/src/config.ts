import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || '0.0.0.0',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  // postgres://user:pass@host:5432/db OR file path for sqlite when not provided
  databaseUrl: process.env.DATABASE_URL || '',
  nodeEnv: process.env.NODE_ENV || 'development',
  cookieName: process.env.AUTH_COOKIE_NAME || 'vibegate_token'
};

export function isProduction() {
  return config.nodeEnv === 'production';
}

