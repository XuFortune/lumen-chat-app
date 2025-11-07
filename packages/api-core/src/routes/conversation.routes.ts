import { Router } from "express";
import { getConversations, getConversationMessages, updateConversation, deleteConversation } from "../controllers/ConversationController";
import { authMiddleware } from "../middleware";

const router = Router()
router.use(authMiddleware)
router.get('/', getConversations)
router.get('/:id/messages', getConversationMessages)
router.patch('/:id', updateConversation)
router.delete('/:id', deleteConversation);
export default router