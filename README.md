# Lumen Chat App - AI Agent Platform

Lumen 是一款采用前后端分离架构的 AI Agent 平台。它集成了工具调用能力（支持计算器、时钟及单位转换）、双层记忆系统以及原创的浮窗智解功能。用户可以在对话中直接划词触发独立浮窗解析，在深度探索知识点的同时，通过上下文隔离技术确保不污染主对话环境，实现个性化、智能化的交互体验。  

## 核心特性

### 🤖 智能 Agent (AI Engine)

*   **自主决策循环**：基于 ReAct 范式，能够进行多轮思考与行动。
*   **工具调用能力**：
    *   `Calculator`: 处理复杂的数学运算。
    *   `DateTime`: 获取当前精确时间与日期。
    *   `UnitConverter`: 支持长度、重量、温度等多种单位转换。
*   **双层记忆系统**：
    *   **短期记忆**：通过滑动窗口管理当前会话上下文。
    *   **长期记忆**：自动提取并持久化用户偏好与关键事实，打造个性化助手。

### 💻 现代化前端 (Frontend)

*   **浮窗智解**：划词唤起独立解释窗口，上下文隔离，避免干扰主对话流。
*   **思维链可视化**：实时展示 AI 的思考过程、工具调用参数及执行结果。
*   **沉浸式交互**：基于 shadcn ui 与 TailwindCSS 4 构建的现代化界面。
*   **流式响应**：基于 SSE (Server-Sent Events) 的打字机效果，支持复杂的事件流（思考、调用、结果）。

### 🛠️ 稳健后端 (API Core)

*   **微服务架构**：API 网关与 AI 引擎分离，职责清晰。
*   **类型安全**：通过 `shared-types` 包在前后端与 AI 引擎间共享 TypeScript 类型定义。
*   **数据持久化**：完整的用户认证、会话管理与消息记录（PostgreSQL）。

## 技术栈

*   **前端**：React 19, Vite 7, TailwindCSS 4, Zustand, shadcn ui
*   **后端**：Express 5, Sequelize 6 (PostgreSQL), JWT
*   **AI 引擎**：LangChain.js
*   **架构**：pnpm workspace (Monorepo)

## 目录结构

```
packages/
  frontend/         # Web 前端（React 应用）
  api-core/         # 业务网关（认证、用户、会话持久化）
  ai-engine/        # 智能引擎（Agent Loop、工具集、记忆系统）
  shared-types/     # 类型定义共享包（DTO、SSE 事件类型等）
```

## 快速开始

### 1. 环境准备

*   Node.js 18+
*   pnpm
*   PostgreSQL (推荐使用 Docker)

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

在各子包 (`packages/*/`) 下创建 `.env` 文件。

**packages/api-core/.env**

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lumen_dev
DB_USER=postgres
DB_PASS=lumen123
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
```

**packages/ai-engine/.env**

```env
PORT=4001
# 如果使用 OpenAI
OPENAI_API_KEY=sk-...
# 如果使用 Gemini
GOOGLE_API_KEY=...
```

**packages/frontend/.env**

```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

### 4. 启动数据库

```bash
docker compose up -d
pnpm --filter api-core db:migrate
```

### 5. 启动开发环境

```bash
pnpm dev
# 同时启动 frontend, api-core, and ai-engine
```

## 流式交互协议 (SSE)

Lumen 扩展了标准的 SSE 协议以支持 Agent 行为：

*   `start`: 会话开始
*   `turn_start`: Agent 开始新一轮思考
*   `tool_call`: Agent 决定调用工具 (包含工具名与参数)
*   `tool_result`: 工具执行完成 (包含执行结果)
*   `chunk`: 文本流片段
*   `memory_active`: 记忆系统检索或更新事件
*   `end`: 响应结束

## 许可证

ISC License