
import { Response } from 'express'
import cloudinary from '../lib/cloudinary'
import type { AuthRequest } from '../middleware/authMiddleware'

export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' })
    }

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'naija-mart/products' },
        (error, result) => {
          if (error || !result) return reject(error)
          resolve(result)
        }
      )
      stream.end(req.file!.buffer)
    })

    res.json({ url: result.secure_url })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to upload image' })
  }
}