
import { Router } from 'express'
import { createDeliveryPartner, getDeliveryPartners, deleteDeliveryPartner } from '../controllers/deliveryPartnerController'
import { protect, isAdmin } from '../middleware/authMiddleware'

const router = Router()

router.post('/', protect, isAdmin, createDeliveryPartner)
router.get('/', protect, isAdmin, getDeliveryPartners)
router.delete('/:id', protect, isAdmin, deleteDeliveryPartner)

export default router





