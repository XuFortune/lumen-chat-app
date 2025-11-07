import createAiRoutes from './ai.routes'
import { Router } from 'express'

const router: ReturnType<typeof Router> = Router()
router.use('/ai', createAiRoutes)
export default router