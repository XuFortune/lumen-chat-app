# Lumen Chat App

一个采用前后端分离与可插拔 AI 引擎的聊天应用单仓库（monorepo）。包含：

- 前端：`React + TypeScript + Vite + TailwindCSS + Zustand + Radix UI`
- 后端：`Express 5 + TypeScript + Sequelize (PostgreSQL) + JWT`
- AI 引擎：`Express + LangChain`，支持 OpenAI 兼容与 Google Gemini，通过 SSE 流式输出

## 技术栈

- 前端：React 19、Vite 7、TailwindCSS 4、Zustand、Radix UI
- 后端：Express 5、Sequelize 6、JWT、dotenv、PostgreSQL
- AI：LangChain（OpenAI、Google Generative AI）
- 包管理：pnpm workspace

## 目录结构

```
packages/
  frontend/         # Web 前端
  api-core/         # 业务 API（认证、会话、消息、代理 AI 流）
  ai-engine/        # AI 引擎服务（统一流式输出）
  shared-types/     # 共享类型（预留）
```

## 快速开始

- 前置条件：安装 Node.js 18+、pnpm、PostgreSQL（本地或云端）
- 克隆与安装：

```bash
pnpm install
```

- 准备环境变量：在各子包创建 `.env`（示例见下方「环境变量」）
- 使用 Docker Compose 启动 PostgreSQL（可选）：

```yaml
version: '3.8'
services:
  postgres-dev:
    image: postgres:16
    container_name: lumen_postgres_dev
    environment:
      # 设置 PostgreSQL 的超级用户名 (默认是 'postgres')
      POSTGRES_USER: postgres
      # 设置超级用户的密码
      POSTGRES_PASSWORD: password
      # 创建一个名为 'lumen_dev' 的数据库
      POSTGRES_DB: lumen_dev
    ports:
      # 将容器的 5432 端口 (PostgreSQL 默认端口) 映射到本地的 5432 端口
      - "5432:5432"
    volumes:
      # 将数据持久化到本地
      - postgres_dev_data:/var/lib/postgresql/data

# 定义一个命名卷来持久化数据
volumes:
  postgres_dev_data:
```

```bash
docker compose up -d
```

- 确保 `packages/api-core/.env` 与上方映射一致：`DB_HOST=localhost`、`DB_PORT=5432`、`DB_NAME=lumen_dev`、`DB_USER=postgres`、`DB_PASS=lumen123`
- 如需清空数据卷并停止容器：`docker compose down -v`
- 初始化数据库（PostgreSQL）：

```bash
pnpm --filter api-core db:migrate
# 如需演示数据（注意：示例种子密码为明文，不可用于登录）
pnpm --filter api-core exec sequelize-cli db:seed:all
```

- 启动开发环境（同时启动前端、API 与 AI 引擎）：

```bash
pnpm dev
```

- 分别启动：

```bash
pnpm --filter frontend dev
pnpm --filter api-core dev
pnpm --filter ai-engine dev
```

## 环境变量

- `packages/api-core/.env`

```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lumen_dev
DB_USER=postgres
DB_PASS=lumen123
JWT_SECRET=replace-with-your-secret
JWT_EXPIRES_IN=7d
```

- `packages/ai-engine/.env`

```
PORT=4001
```

AI 引擎的 `API Key` 与 `baseUrl` 通过请求体动态传入（见下方「流式聊天接口」）。

- `packages/frontend/.env`

```
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

## 主要功能

- 用户注册、登录与鉴权（JWT）
- 会话与消息管理（PostgreSQL，Sequelize 模型与迁移）
- 统一 AI 流代理：后端聚合 AI 引擎的 SSE 流式输出，支持持久化到会话消息
- 前端聊天工作区：对话列表、消息区、输入区，支持流式展示

## API 说明

- 基础健康检查：`GET /api/v1/health`
- 认证：
  - `POST /api/v1/auth/register` `{ username, password }`
  - `POST /api/v1/auth/login` → `{ token, user }`
- 用户：
  - `GET /api/v1/user/profile`（需 `Authorization: Bearer <token>`）
- 会话：
  - `GET /api/v1/conversations`（需认证）
  - `GET /api/v1/conversations/:id/messages`（需认证）
  - `PATCH /api/v1/conversations/:id` `{ title }`（需认证）
  - `DELETE /api/v1/conversations/:id`（需认证）
- 新建会话：
  - `POST /api/v1/chat/new` `{ initialContent?: string, title?: string }`（需认证）
- 流式聊天（SSE）：
  - `POST /api/v1/ai/stream`（需认证）

## 流式聊天接口（SSE）

- 请求体示例（由前端发起）：

```json
{
  "conversation_id": null,
  "history": [
    { "role": "user", "content": "你好" },
    { "role": "assistant", "content": "你好，我可以帮你什么？" }
  ],
  "currentMessage": "帮我用 Go 写一个 HTTP 服务",
  "config": {
    "model": "gpt-4o-mini",
    "apiKey": "YOUR_API_KEY",
    "baseUrl": "https://api.openai.com/v1" // OpenAI 兼容必须提供
  },
  "ephemeral": false
}
```

- 服务端事件（SSE data）
  - `{"event":"start","conversation_id":"...","user_message_id":"..."}`
  - `{"chunk":"..."}`（多次）
  - `{"event":"end","conversation_id":"...","message_id":"..."}`
  - 发生错误：`{"event":"error","message":"..."}`

- 前端实现参考（已内置）：`packages/frontend/src/services/conversationService.ts`

## 代码位置参考

- 鉴权中间件：`packages/api-core/src/middleware/auth.middleware.ts:1`
- AI 流代理：`packages/api-core/src/controllers/AiProxyController.ts:41`
- 会话与消息 CRUD：`packages/api-core/src/controllers/ConversationController.ts:1`
- AI 引擎流实现：`packages/ai-engine/src/controllers/AiController.ts:27`
- 前端 API 客户端：`packages/frontend/src/services/apiClient.ts:1`

## 构建与预览

- 前端构建与预览：

```bash
pnpm --filter frontend build
pnpm --filter frontend preview
```

- 后端与 AI 引擎构建：

```bash
pnpm --filter api-core build
pnpm --filter ai-engine build
```

## 常见问题

- 种子数据密码为明文，无法与 bcrypt 登录逻辑匹配。请使用注册接口创建账号后登录。
- OpenAI 兼容提供商必须传入 `baseUrl` 与 `apiKey`；Google Gemini 仅需 `apiKey`（在请求体 `config` 中传入）。

## 许可证

ISC License