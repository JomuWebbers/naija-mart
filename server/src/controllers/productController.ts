
import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category } = req.query

    const products = await prisma.product.findMany({
      ...(category ? { where: { category: category as string } } : {}),
      orderBy: { createdAt: 'desc' },
    })

    res.json(products)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch products' })
  }
}
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

      if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: 'Product id is required' })
    }
    
    const product = await prisma.product.findUnique({ where: { id } })

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.json(product)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch product' })
  }
}

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, originalPrice, image, category, stock } = req.body

    if (!name || !price || !image || !category) {
      return res.status(400).json({ message: 'Name, price, image, and category are required' })
    }

    const product = await prisma.product.create({
      data: { name, description, price, originalPrice, image, category, stock },
    })

    res.status(201).json(product)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to create product' })
  }
}

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: 'Product id is required' })
    }

    const product = await prisma.product.update({
      where: { id },
      data: req.body,
    })

    res.json(product)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to update product' })
  }
}

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: 'Product id is required' })
    }

    await prisma.product.delete({ where: { id } })

    res.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to delete product' })
  }
}









