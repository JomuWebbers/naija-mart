
import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import type { AuthRequest } from '../middleware/authMiddleware'
import { LGA_COORDINATES, STATE_WAREHOUSE } from '../data/lgaCoordinates'

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const prisma = new PrismaClient()


export const assignDeliveryPartner = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { deliveryPartnerId } = req.body

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: 'Order id is required' })
    }
    if (!deliveryPartnerId) {
      return res.status(400).json({ message: 'deliveryPartnerId is required' })
    }

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const partner = await prisma.deliveryPartner.findUnique({ where: { id: deliveryPartnerId } })
    if (!partner) {
      return res.status(404).json({ message: 'Delivery partner not found' })
    }

    const shippingAddress = order.shippingAddress as { state?: string; city?: string }
    const state = shippingAddress?.state
    const startPoint = state ? STATE_WAREHOUSE[state] : undefined

    if (!startPoint) {
      return res.status(400).json({ message: 'No warehouse configured for this order\'s state' })
    }

    const history = Array.isArray(order.statusHistory) ? order.statusHistory : []

    const updated = await prisma.order.update({
      where: { id },
      data: {
        deliveryPartnerId,
        deliveryOtp: generateOtp(),
        liveLocation: startPoint,
        status: 'Assigned',
        statusHistory: [...history, { status: 'Assigned', at: new Date().toISOString() }],
      },
    })

    res.json(updated)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to assign delivery partner' })
  }
}


export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    const { items, shippingAddress, paymentMethod, subtotal, deliveryFee, tax } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' })
    }
    if (!shippingAddress || !paymentMethod || subtotal === undefined) {
      return res.status(400).json({ message: 'Missing required order fields' })
    }

    const total = subtotal + (deliveryFee || 0) + (tax || 0)

    const order = await prisma.order.create({
      data: {
        userId,
        items,
        shippingAddress,
        paymentMethod,
        subtotal,
        deliveryFee: deliveryFee || 0,
        tax: tax || 0,
        total,
        status: 'Placed',
        statusHistory: [{ status: 'Placed', at: new Date().toISOString() }],
        isPaid: paymentMethod !== 'Pay on Delivery' && paymentMethod !== 'Card (Paystack)',
      },
    })

    res.status(201).json(order)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to create order' })
  }
}

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    res.json(orders)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch orders' })
  }
}

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.userId

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: 'Order id is required' })
    }

    const order = await prisma.order.findUnique({ where: { id }, include: { deliveryPartner: true  } })

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // Only the order's owner or an admin can view it
    if (order.userId !== userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' })
    }

    res.json(order)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch order' })
  }
}

export const getAllOrders = async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    })
    res.json(orders)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch orders' })
  }
}

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: 'Order id is required' })
    }
    if (!status) {
      return res.status(400).json({ message: 'Status is required' })
    }

    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const history = Array.isArray(existing.statusHistory) ? existing.statusHistory : []

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        statusHistory: [...history, { status, at: new Date().toISOString() }],
      },
    })

    res.json(order)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to update order status' })
  }
}









