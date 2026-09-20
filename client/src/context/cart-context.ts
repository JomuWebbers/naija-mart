
import { createContext } from 'react'

export type CartItem = {
  id: string
  name: string
  price: number
  image: string
  sellerId: string
  qty: number
}

export type CartContextType = {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  removeFromCart: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  totalItems: number
  subtotal: number
}

export const CartContext = createContext<CartContextType | undefined>(undefined)



