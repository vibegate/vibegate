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

使用JWT（JSON Web Tokens）进行用户身份验证和授权。所有需要身份验证的API都需要在请求头中包含有效的JWT。

作为鉴权的jwt存在本地localStorage中。

#### 应用转发

应用转发通过反向代理实现。VibeGate将根据请求的路径或子域名将请求转发到相应的后端服务。

代理配置存储在数据库中，支持通过管理界面动态添加、修改和删除转发规则。

### 项目结构

#### docs

存放项目开发相关文档。

#### apps/web

登陆、注册以及管理端涉及的所有网页。
使用Next.js + TailwindCSS + React + TypeScript
后端逻辑也暂时置于此。

#### apps/debugger

用于作为后端应用调试的Next.js应用。

#### packages/database

数据库相关的逻辑。使用Prisma ORM。

#### apps/cli

命令行工具。用于基础操作和启动MCP等

## 数据模型（详见 packages/database/prisma/schema.prisma）

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

# 启动数据库
docker-compose up -d

# 同步数据库schema（开发阶段）
pnpm db:push

# 启动开发服务器
pnpm dev
```

