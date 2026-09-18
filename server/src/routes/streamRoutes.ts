
import { Router } from 'express'
import { createStreamToken, getSupportAgent } from '../controllers/streamController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.get('/token', protect, createStreamToken)
router.get('/support-agent', protect, getSupportAgent)

export default router


