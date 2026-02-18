// routes/index.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware';
import authRoutes from './auth.routes';
import userRoutes from './user.routes'
import aiRoutes from './ai.routes'
import conversationRoutes from './conversation.routes'
import newChatRoutes from './newChat.routes'
import userMemoryRoutes from './userMemory.routes'

const router = Router();
router.use('/auth', authRoutes);
router.use('/user', userRoutes)
router.use('/ai', authMiddleware, aiRoutes)
router.use('/conversations', conversationRoutes)
router.use('/chat', authMiddleware, newChatRoutes)
router.use('/user-memory', userMemoryRoutes)
export default router;
