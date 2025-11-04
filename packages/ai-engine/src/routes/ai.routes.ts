// packages/ai-engine/src/routes/ai.routes.ts
import { Router } from 'express';
import { handleChatStream } from '../controllers/index';


const router = Router();

// 内部 API: 处理流式聊天请求
router.post('/stream', handleChatStream);

export default router;

