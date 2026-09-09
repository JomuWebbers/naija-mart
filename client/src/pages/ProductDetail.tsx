
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Wire, MicroLabel, Divider, PageShell } from '../components/wireframe-primitives'
import { fmt, pct } from '../components/wireframe-helpers'
import { apiRequest } from '../lib/api'

type product = {
  id: string
  name: string
  description: string
  price: number
  originalPrice: number
  image: string
  category: string
  stock: number
  rating: number
  reviewCount: number
}

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState<product | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [qty, setQty] = useState(1)

useEffect(() => {
  if (!id) return

  apiRequest(`/products/${id}`)
    .then(data => setProduct(data))
    .catch(() => setNotFound(true))
}, [id])

if (notFound) {
  return (
    <div className="p-10 text-center">
      <p className="font-bold mb-4">Product not found.</p>
      <Link to="/" className="underline font-bold">Back to Home</Link>
    </div>
  )
}

if (!product) {
  return <div className="p-10 text-center font-bold">Loading product…</div>
}

  const hasDiscount = product.originalPrice > product.price
  return (
    <PageShell title="" breadcrumb="Home / Electronics / Phones & Tablets">
      {/* Responsive: stacked on mobile, side-by-side from md up */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

        {/* ── Image gallery ─────────────────────────────────────── */}
        <div className="md:col-span-6">
          <Wire h="h-72 md:h-96" label="MAIN product IMAGE" />
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[1, 2, 3, 4].map(i => (
              <Wire key={i} h="h-16 md:h-20" label={`THUMB ${i}`} />
            ))}
          </div>
        </div>

        {/* ── Info panel ────────────────────────────────────────── */}
        <div className="md:col-span-6 flex flex-col">
          <MicroLabel>{product.category}</MicroLabel>
          <h1
            className="font-black uppercase leading-tight mt-2"
            style={{ fontSize: 'clamp(22px, 3vw, 32px)', letterSpacing: '-0.03em' }}
          >
            {product.name}
          </h1>

          <div className="flex items-center gap-2 mt-3">
            <span className="text-[12px] font-bold">★ {product.rating}</span>
            <span className="text-[11px] text-neutral-400">({product.reviewCount} reviews)</span>
          </div>

        <div className="flex items-baseline gap-3 mt-5">
            <span className="text-[28px] font-black">{fmt(product.price)}</span>
            {hasDiscount && (
        <>
        <span className="text-[14px] text-neutral-400 line-through">{fmt(product.originalPrice)}</span>
        <span className="text-[10px] font-black bg-black text-white px-2 py-1">
        -{pct(product.price, product.originalPrice)}%
      </span>
        </>
        )}
    </div>

          <Divider />

          {/* Delivery address block — ties into multi-state tracking scope */}
          <div className="py-5">
            <MicroLabel>Deliver To</MicroLabel>
            <div className="flex items-center justify-between mt-2 border border-black/20 p-3">
              <span className="text-[13px] font-semibold">Osun, Lagos or Oyo state ▾</span>
              <span className="text-[10px] uppercase font-bold underline cursor-pointer">Change</span>
            </div>
          </div>

          <Divider />

          {/* Quantity + actions — stacks full-width on mobile */}
          <div className="py-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center border-2 border-black w-fit">
              <button
                className="px-4 py-3 text-[14px] font-black"
                onClick={() => setQty(q => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="px-5 py-3 text-[14px] font-bold border-x-2 border-black">{qty}</span>
              <button className="px-4 py-3 text-[14px] font-black" onClick={() => setQty(q => q + 1)}>
                +
              </button>
            </div>
            <button className="flex-1 py-4 border-2 border-black text-[11px] tracking-[0.2em] uppercase font-black">
              Add to Cart
            </button>
            <button
              style={{ backgroundColor: 'var(--vermilion)' }}
              className="flex-1 py-4 text-white text-[11px] tracking-[0.2em] uppercase font-black"
            >
              Buy Now
            </button>
          </div>

          <Divider />

          {/* Trust badges — wraps on mobile instead of overflowing */}
          <div className="flex flex-wrap items-center gap-6 mt-5 pt-5">
            {['Free Returns', '100% Authentic', 'Secure Payments'].map(t => (
              <div key={t} className="flex flex-col gap-0.5">
                <div className="w-4 h-4 bg-black" />
                <MicroLabel>{t}</MicroLabel>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Description + reviews ─────────────────────────────────── */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <MicroLabel>product Description</MicroLabel>
          <Wire h="h-40" label="DESCRIPTION TEXT BLOCK" />
        </div>
        <div>
          <MicroLabel>Customer Reviews</MicroLabel>
          <div className="space-y-3 mt-2">
            {[1, 2, 3].map(i => (
              <Wire key={i} h="h-20" label={`REVIEW ${i}`} />
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  )
}



