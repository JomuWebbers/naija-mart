import { Router } from 'express'
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyListings,
  reviewListing,
} from '../controllers/productController'
import { protect, isAdmin, optionalAuth } from '../middleware/authMiddleware'

const router = Router()

// Public
router.get('/', getProducts)
router.get('/my-listings', protect, getMyListings)
router.get('/:id', optionalAuth, getProductById)

// Any logged-in user
router.post('/', protect, createProduct)

// Admin-only
router.patch('/:id', protect, isAdmin, updateProduct)
router.delete('/:id', protect, isAdmin, deleteProduct)
router.patch('/:id/review', protect, isAdmin, reviewListing)

export default router




