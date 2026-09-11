
import { Router } from 'express'
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController'
import { protect, isAdmin } from '../middleware/authMiddleware'

const router = Router()

// Logged-in user routes
router.post('/', protect, createOrder)
router.get('/my-orders', protect, getMyOrders)
router.get('/:id', protect, getOrderById)

// Admin-only routes
router.get('/', protect, isAdmin, getAllOrders)
router.patch('/:id/status', protect, isAdmin, updateOrderStatus)

export default router


