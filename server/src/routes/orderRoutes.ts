
import { Router } from 'express'
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  assignDeliveryPartner,
} from '../controllers/orderController'

import { protect, isAdmin } from '../middleware/authMiddleware'
import { verifyPayment } from '../controllers/paymentController'

const router = Router()

// Logged-in user routes
router.post('/', protect, createOrder)
router.get('/my-orders', protect, getMyOrders)
router.get('/:id', protect, getOrderById)

// Admin-only routes
router.get('/', protect, isAdmin, getAllOrders)
router.patch('/:id/status', protect, isAdmin, updateOrderStatus)
router.patch('/:id/assign', protect, isAdmin, assignDeliveryPartner)
router.patch('/:id/verify-payment', protect, verifyPayment)

export default router


