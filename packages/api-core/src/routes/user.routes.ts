// src/routes/user.routes.ts
import { Router } from 'express';
import { getProfile } from '../controllers';
import { authMiddleware } from '../middleware/index';

const router = Router();

// 所有路由都需认证
router.use(authMiddleware);
router.get('/profile', getProfile);

export default router;
