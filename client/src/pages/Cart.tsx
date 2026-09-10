
import { Link } from 'react-router-dom'
import { Wire, MicroLabel, Divider, PageShell } from '../components/wireframe-primitives'
import { fmt } from '../components/wireframe-helpers'
import { useCart } from '../context/useCart'






// Then, in the JSX below, replace the hardcoded CART_ITEMS.map(item => ...) loop to use the real items from context, and wire the quantity buttons and remove button:





export default function Cart() {
  const { items, removeFromCart, updateQty, subtotal } = useCart()
  const delivery = items.length > 0 ? 3_500 : 0
  const total = subtotal + delivery

  if (items.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="font-bold mb-4">Your cart is empty.</p>
        <Link to="/" className="underline font-bold">Continue Shopping</Link>
      </div>
    )
  }



  return (
    <PageShell title="Your Cart" breadcrumb={`${items.length} items`}>
      {/* Responsive: summary stacks below items on mobile, sits beside them from lg up */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Cart items ────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-4">
        {items.map(item => (
          <div key={item.id} className="border-2 border-black flex flex-col sm:flex-row gap-4 p-4">
          <Wire h="h-28 w-full sm:w-28" label="PRODUCT" />
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[14px] font-bold">{item.name}</p>
            <span className="text-[13px] font-black block mt-1">{fmt(item.price)}</span>
        </div>
        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
        <div className="flex items-center border-2 border-black w-fit">
          <button className="px-3 py-2 text-[13px] font-black" onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
          <span className="px-4 py-2 text-[13px] font-bold border-x-2 border-black">{item.qty}</span>
          <button className="px-3 py-2 text-[13px] font-black" onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
        </div>
        <button className="text-[10px] uppercase font-bold underline text-neutral-500" onClick={() => removeFromCart(item.id)}>
          Remove
        </button>
      </div>
    </div>
  </div>
))}

          <div className="border border-black/15 p-4 flex items-center gap-3">
            <input type="text" placeholder="Promo code" className="flex-1 outline-none text-[13px]" />
            <button className="px-5 py-2 border-2 border-black text-[10px] tracking-[0.2em] uppercase font-black">
              Apply
            </button>
          </div>
        </div>

        {/* ── Order summary ─────────────────────────────────────── */}
        <div className="lg:col-span-4">
          <div className="border-2 border-black p-5 sticky top-4">
            <MicroLabel>Order Summary</MicroLabel>
            <div className="mt-4 space-y-3 text-[13px] font-semibold">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Delivery Fee</span>
                <span>{fmt(delivery)}</span>
              </div>
            </div>
            <Divider thick />
            <div className="flex justify-between text-[16px] font-black mt-3">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
            <button
              style={{ backgroundColor: 'var(--vermilion)' }}
              className="w-full py-4 mt-5 text-white text-[11px] tracking-[0.2em] uppercase font-black"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}




