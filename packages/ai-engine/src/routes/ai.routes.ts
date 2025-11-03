// packages/ai-engine/src/routes/ai.routes.ts
import { Router } from 'express';
import { handleChatStream } from '../controllers/index';

export const createAiRoutes = () => {
    const router = Router();

    // 内部 API: 处理流式聊天请求
    router.post('/chat/stream', handleChatStream);

    return router;
};
