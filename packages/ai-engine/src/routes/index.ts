import createAiRoutes from './ai.routes'
import { Router } from 'express'

const router = Router()
router.use('/ai', createAiRoutes)
export default router