import { Router } from "express"
import { startNewChat } from "../controllers/NewChatController"

const router = Router()
router.post('/new',startNewChat)
export default router