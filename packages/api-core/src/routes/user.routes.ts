// src/routes/user.routes.ts
import { Router } from 'express';
import { getProfile, updateLLMConfigs } from '../controllers';
import { authMiddleware } from '../middleware/index';

const router = Router();

// 所有路由都需认证
router.use(authMiddleware);
router.get('/profile', getProfile);
router.put('/llm-configs', updateLLMConfigs);

export default router;
