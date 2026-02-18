// packages/api-core/src/routes/userMemory.routes.ts
import { Router } from 'express';
import { getUserMemory, updateUserMemory } from '../controllers/UserMemoryController';
import { authMiddleware } from '../middleware';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

router.get('/', getUserMemory);
router.put('/', updateUserMemory);

export default router;
