# VibeGate

A lightweight API gateway solution that provides unified user authentication and reverse proxy services for modern web applications. Designed to help developers quickly build new projects without repeatedly implementing basic systems like user management and authentication.

## Features

- 🔐 **Built-in User System** - Complete registration, login, and JWT authentication
- 🔀 **Smart Reverse Proxy** - Path-based request forwarding with authentication middleware
- 🎛️ **Admin Console** - Web UI for managing users and proxy rules
- 🔌 **Plugin System** - Extensible plugin architecture for custom functionality
- 🚀 **High Performance** - Built on Fastify with native HTTP/2 support
- 📦 **Flexible Deployment** - SQLite for development, PostgreSQL for production

## Quick Start

### Prerequisites

- Node.js >= 22
- pnpm >= 10.6.3

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/vibegate.git
cd vibegate

# Install dependencies
pnpm install
```

### Development

```bash
# Start all services (recommended)
pnpm dev

# Or start services individually
pnpm dev --filter gateway    # Gateway service (port 3000)
pnpm dev --filter web        # Admin UI (port 5173)
pnpm dev --filter debugger   # Debug service (port 3333)
```

Access:

- Admin UI: `http://localhost:3000/vibegate/login`
- API Endpoints: `http://localhost:3000/vibegate/api`
- Health Check: `http://localhost:3000/vibegate/api/health`

### Production Deployment

#### 1. Build

```bash
# Build all projects
pnpm build

# Or build individually
pnpm build --filter gateway
pnpm build --filter web
```

#### 2. Configure Environment Variables

```bash
# .env file example
NODE_ENV=production
PORT=3000
JWT_SECRET=your-secret-key-here
DATABASE_URL=postgres://user:password@localhost:5432/vibegate
```

#### 3. Start Services

```bash
# Using PostgreSQL
DATABASE_URL=postgres://... pnpm start --filter gateway

# Or using SQLite (not recommended for production)
pnpm start --filter gateway
```

## Project Structure

```text
vibegate/
├── apps/
│   ├── gateway/        # Core gateway service (Fastify + TypeScript)
│   ├── web/           # Admin UI (React + Vite + TailwindCSS)
│   └── debugger/      # Debug tool with interactive request tester (Next.js)
├── packages/
│   ├── plugin-sdk/    # Plugin development SDK
│   ├── common/        # Shared utilities and types
│   ├── ui/           # Shared UI components
│   ├── eslint-config/ # ESLint configuration
│   └── typescript-config/ # TypeScript configuration
└── docs/             # Project documentation
```

## API Documentation

All VibeGate APIs are under the `/vibegate` path to avoid conflicts with proxied applications.

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/vibegate/api/auth/register` | User registration |
| POST | `/vibegate/api/auth/login` | User login |
| POST | `/vibegate/api/auth/logout` | User logout |
| GET | `/vibegate/api/auth/me` | Get current user info |

### Proxy Management (Authentication Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/vibegate/api/admin/routes` | Get all proxy rules |
| POST | `/vibegate/api/admin/routes` | Create proxy rule |
| PUT | `/vibegate/api/admin/routes/:id` | Update proxy rule |
| DELETE | `/vibegate/api/admin/routes/:id` | Delete proxy rule |

### User Management (Authentication Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/vibegate/api/admin/users` | Get user list |
| GET | `/vibegate/api/admin/users/:id` | Get user details |

## Plugin Development

VibeGate supports extending functionality through plugins. Plugins can:

- Modify requests/responses
- Add custom middleware
- Inject custom headers
- Implement hook functions

### Creating a Plugin Example

```typescript
import type { VibeGatePlugin } from '@repo/plugin-sdk';

const myPlugin: VibeGatePlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  init(api) {
    // Register request hook
    api.hooks.onRequest((req) => {
      api.logger.info(`Request to: ${req.url}`);
    });
    
    // Modify response
    api.hooks.onSend((req, reply, payload) => {
      reply.header('X-Custom-Header', 'value');
      return payload;
    });
  }
};

export default myPlugin;
```

## Data Models

### User Table

- `id` (UUID) - User unique identifier
- `email` (string) - Email address (unique)
- `hashedPassword` (string) - Encrypted password
- `name` (string) - Username
- `createdAt` (timestamp) - Creation time
- `updatedAt` (timestamp) - Update time

### ProxyRoute Table

- `id` (UUID) - Route rule unique identifier
- `path` (string) - Path matching rule
- `target` (string) - Target service address
- `requireAuth` (boolean) - Authentication required
- `enabled` (boolean) - Enabled status
- `createdAt` (timestamp) - Creation time
- `updatedAt` (timestamp) - Update time

## Tech Stack

- **Gateway Service**: Fastify + TypeScript + Drizzle ORM
- **Admin UI**: React + Vite + TailwindCSS + React Router
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT (JSON Web Tokens)
- **Build Tools**: Turbo + pnpm workspaces

## Debug Tool

The debugger app (`http://localhost:3333`) provides an interactive interface for testing and debugging your VibeGate configuration:

- **Request Testing**: Send HTTP requests with custom headers and bodies
- **Response Inspection**: View complete request/response details including headers
- **Proxy Debugging**: Test how VibeGate routes and transforms requests
- **Authentication Testing**: Test protected routes with authorization tokens

## Common Commands

```bash
# Development
pnpm dev              # Start all services
pnpm dev --filter <app>  # Start specific service

# Build
pnpm build            # Build all projects
pnpm build --filter <app>  # Build specific project

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Format code
pnpm check-types      # TypeScript type checking

# Testing
pnpm smoke            # Run smoke tests
```

## Roadmap

### Phase 1 - Core Features ✅

- [x] User registration/login
- [x] JWT authentication
- [x] Reverse proxy
- [x] Admin interface
- [x] Basic plugin architecture

### Phase 2 - Extended Features

- [ ] OAuth login (Google, GitHub)
- [ ] API Key management
- [ ] Rate limiting and circuit breaking
- [ ] Monitoring and logging
- [ ] WebSocket support
- [ ] Payment integration

## Contributing

Issues and Pull Requests are welcome!
