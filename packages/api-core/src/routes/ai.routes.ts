import { Router } from "express";
import { handleAiStreamProxy } from "../controllers/AiProxyController";

const router = Router()
router.post('/stream', handleAiStreamProxy)
export default router