// routes/index.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware';
import authRoutes from './auth.routes';
import userRoutes from './user.routes'
import aiRoutes from './ai.routes'
const router = Router();
router.use('/auth', authRoutes);
router.use('/user', userRoutes)
router.use('/ai', authMiddleware, aiRoutes)
export default router;
