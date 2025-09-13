# VibeGate

## 想解决的问题

Vibe Coding时代后，会有很多新项目出现。哪怕有AI帮忙，也要 重复写、重复测试、持续维护 用户系统、付费系统这种基本的系统。我们希望有一个相对隔离的网关系统，集成基本的用户系统、身份系统。把 登陆、注册 和基本的用户管理都写在这里。

用户系统是最基本的系统，除了用户系统。其他系统希望可以用插件化的方式进行扩展。

### 要求

Simple to use

## MVP功能范围

### Phase 1 - 核心功能（当前目标）

1. **用户系统**

   - 用户注册（邮箱/密码）
   - 用户登录/登出
   - JWT token管理
   - 基础的用户信息管理

2. **反向代理**

   - 基于路径的请求转发
   - JWT验证中间件
   - 代理配置管理

3. **管理界面**
   - 用户列表查看
   - 代理规则配置
   - 系统状态监控

### Phase 2 - 后续扩展

- OAuth登录
- 插件系统
- API Key管理
- 付费功能集成

### 技术细节

#### 鉴权

使用 JWT（JSON Web Tokens）进行用户身份验证和授权。默认通过 HttpOnly Cookie 携带，兼容 `Authorization: Bearer` 头用于脚本/CLI 访问。

#### 应用转发

通过独立网关服务的反向代理实现（Fastify + 原生 fetch）。VibeGate 根据路径前缀将请求转发到目标服务，支持：

- 路由优先级（可通过 order 字段自定义优先级）
- 认证要求（匹配到路由后再校验）
- 路径重写（去除匹配前缀）
- **用户信息传递**：需要认证的路由会自动在转发请求中添加 `Vg-User` header，包含当前用户的身份信息

#### 用户信息传递

当代理路由设置了 `requireAuth: true` 时，VibeGate 会在转发请求时自动添加 `Vg-User` header，包含 JSON 格式的用户信息：

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "User Name",
  "isAdmin": false
}
```

后端应用可以直接解析该 header 获取用户身份，无需自己实现认证逻辑。

### 项目结构

#### docs

存放项目开发相关文档。

#### apps/gateway

独立网关服务：Fastify + TypeScript。提供认证、代理路由管理 API、反向代理能力；内置插件系统。
开发使用 SQLite，生产支持 Postgres（通过 `DATABASE_URL` 切换）。

目录：

- src/core: 认证、代理、DB、核心路由
- src/plugins: 内置插件（示例 header 注入）
- src/loader: 插件加载器

#### apps/web

Web 端（包含登录/注册与管理 UI）：Vite + React + TailwindCSS（shadcn/ui 风格组件），仅调用网关 API。

#### apps/debugger

调试用回源服务（Next.js），用于验证网关反向代理是否正确转发。
会可视化的显示任何请求的细节（Headers、Body等）。

#### packages/plugin-sdk

插件开发 SDK。定义插件接口与受限的能力注入（日志、钩子等），用于开发内置或第三方插件。

## 数据模型（基于 Drizzle ORM）

### User

- id (UUID)
- email (唯一)
- hashedPassword
- name
- createdAt
- updatedAt

### ProxyRoute

- id (UUID)
- path (路径匹配规则)
- target (目标服务地址)
- requireAuth (是否需要认证)
- enabled (是否启用)
- order (路由优先级，数字越小优先级越高)
- createdAt
- updatedAt

## API设计

所有VibeGate的API都在 `/vibegate` 路径下，避免与被代理的应用冲突。

### 认证相关

- POST /vibegate/api/auth/register - 用户注册
- POST /vibegate/api/auth/login - 用户登录
- POST /vibegate/api/auth/logout - 用户登出
- GET /vibegate/api/auth/me - 获取当前用户信息

### 代理管理（需要认证）

- GET /vibegate/api/admin/routes - 获取所有代理规则
- POST /vibegate/api/admin/routes - 创建代理规则
- PUT /vibegate/api/admin/routes/:id - 更新代理规则
- DELETE /vibegate/api/admin/routes/:id - 删除代理规则
- PUT /vibegate/api/admin/routes/order - 批量更新路由优先级

### 用户管理（需要认证）

- GET /vibegate/api/admin/users - 获取用户列表
- GET /vibegate/api/admin/users/:id - 获取用户详情

### 管理界面

- /vibegate/login - 登录页面
- /vibegate/register - 注册页面
- /vibegate/admin - 管理控制台

## 开发环境

```bash
# 安装依赖
pnpm install

# 启动网关（Fastify，默认 SQLite，端口 3000）
pnpm dev --filter gateway

# 启动管理 Web（Vite，开发端口 5173）
pnpm dev --filter web

# 启动调试服务（回源，默认 3333）
pnpm dev --filter debugger

# 指定 Postgres（生产/本地均可）
# 需提供 DATABASE_URL=postgres://user:pass@host:5432/db
DATABASE_URL=postgres://... pnpm dev --filter gateway

### 生产部署（方案 A）

1. 构建前端：`pnpm -w --filter web build`，产物位于 `apps/web/dist`
2. 网关会在 `/vibegate` 前缀下静态托管该目录，并对非 `/vibegate/api/**` 路径做 SPA fallback（返回 `index.html`）
3. 统一入口：访问 `http://<host>:3000/vibegate/...`，其中：
   - `/vibegate/api/**` 与 `/vibegate/health` 由网关处理
   - 其他 `/vibegate/**` 由前端路由处理
```
