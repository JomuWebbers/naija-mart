
import { Router } from 'express'
import multer from 'multer'
import { uploadImage } from '../controllers/uploadController'
import { protect, isAdmin } from '../middleware/authMiddleware'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })
const router = Router()

router.post('/', protect, isAdmin, upload.single('image'), uploadImage)

export default router

