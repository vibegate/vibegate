# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VibeGate is a monorepo API gateway solution with user authentication and reverse proxy services. It uses pnpm workspaces and Turborepo for build orchestration.

## Key Commands

### Development
```bash
pnpm dev                    # Start all services (gateway:3000, web:5173, debugger:3001)
pnpm dev --filter gateway   # Start gateway service only
pnpm dev --filter web       # Start admin UI only
```

### Build & Production
```bash
pnpm build                  # Build all projects
pnpm build --filter <app>   # Build specific project
pnpm start --filter gateway # Start gateway in production (after build)
```

### Code Quality
```bash
pnpm lint                   # Run ESLint across all projects
pnpm format                 # Format code with Prettier
pnpm check-types            # TypeScript type checking via Turbo
```

### Testing
```bash
pnpm smoke                  # Run smoke tests (scripts/smoke-gateway.mjs)
```

## Architecture Overview

### Database Architecture
- **Dual Schema Support**: The gateway supports both SQLite (development) and PostgreSQL (production)
- **Schema Definition**: Database schemas are defined in `apps/gateway/src/core/db/schema.ts` with separate definitions for SQLite and PostgreSQL
- **Database Client**: The database client in `apps/gateway/src/core/db/client.ts` automatically selects the appropriate database based on the `DATABASE_URL` environment variable
- **Tables**: 
  - `users`: User authentication and management
  - `proxy_routes`: Dynamic proxy route configuration

### Authentication System
- **JWT-based**: Uses JSON Web Tokens stored in HTTP-only cookies
- **Core Auth Module**: `apps/gateway/src/core/auth.ts` handles token generation and validation
- **Auth Routes**: `apps/gateway/src/core/routes/auth.ts` provides registration, login, logout endpoints
- **Middleware**: Authentication middleware validates JWT tokens and attaches user info to requests

### Proxy System
- **Dynamic Routing**: Routes are stored in database and loaded at runtime
- **Core Proxy Module**: `apps/gateway/src/core/proxy.ts` handles request forwarding
- **Path-based Routing**: Matches incoming paths to target services
- **Authentication Integration**: Routes can require authentication before forwarding

### Plugin Architecture
- **Plugin SDK**: `packages/plugin-sdk` provides TypeScript types and interfaces
- **Plugin Loader**: `apps/gateway/src/loader/` handles plugin discovery and initialization
- **Hook System**: Plugins can register hooks for request/response lifecycle events
- **Built-in Plugins**: Located in `apps/gateway/src/plugins/`

### Frontend Architecture
- **Admin UI**: React application in `apps/web/` using Vite, React Router, and TailwindCSS
- **Base Path**: Web app is served under `/vibegate` path in production
- **API Integration**: Communicates with gateway via `/vibegate/api` endpoints
- **Static Serving**: In production, built web assets are served directly by the gateway

## Important Conventions

### API Path Structure
All VibeGate APIs use the `/vibegate` prefix to avoid conflicts with proxied applications:
- `/vibegate/api/auth/*` - Authentication endpoints
- `/vibegate/api/admin/*` - Admin management endpoints
- `/vibegate/health` - Health check endpoint

### Database Migrations
- No migration system currently implemented
- Tables are created automatically on first run
- Schema changes require manual database updates

### Environment Variables
- `NODE_ENV`: Set to "production" for production deployments
- `PORT`: Gateway server port (default: 3000)
- `JWT_SECRET`: Required for JWT token signing
- `DATABASE_URL`: PostgreSQL connection string (optional, defaults to SQLite)

### Request Flow
1. Request arrives at gateway
2. Check if path matches `/vibegate/*` (internal routes)
3. If not, check proxy_routes table for matching path
4. If route requires auth, validate JWT token
5. Forward request to target service or handle internally
6. Apply any plugin hooks during request/response lifecycle