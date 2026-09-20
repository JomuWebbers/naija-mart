
import { Router } from 'express'
import {
  getProducts, getProductById, createProduct, updateProduct, deleteProduct,
  getMyListings, reviewListing,
} from '../controllers/productController'
import { protect, isAdmin } from '../middleware/authMiddleware'

const router = Router()

// Public
router.get('/', getProducts)
router.get('/:id', getProductById)

// Any logged-in user (marketplace listing submission + their own listings)
router.post('/', protect, createProduct)
router.get('/my-listings', protect, getMyListings)

// Admin-only
router.patch('/:id', protect, isAdmin, updateProduct)
router.delete('/:id', protect, isAdmin, deleteProduct)
router.patch('/:id/review', protect, isAdmin, reviewListing)

export default router

