
import { Router } from 'express'
import { getMe, linkBankAccount, withdraw } from '../controllers/userController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.get('/me', protect, getMe)
router.patch('/bank-account', protect, linkBankAccount)
router.post('/withdraw', protect, withdraw)

export default router


