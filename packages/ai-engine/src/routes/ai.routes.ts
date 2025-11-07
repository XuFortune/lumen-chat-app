// packages/ai-engine/src/routes/ai.routes.ts
import { Router } from 'express';
import { handleAiStream } from '../controllers/index';


const router: ReturnType<typeof Router> = Router();

// 内部 API: 处理流式聊天请求
router.post('/stream', handleAiStream);

export default router;

