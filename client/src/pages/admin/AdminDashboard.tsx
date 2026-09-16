
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PackageIcon, ShoppingBagIcon, TruckIcon, AlertTriangleIcon,
  BanknoteIcon, ArrowRightIcon,
} from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import { apiRequest } from '../../lib/api'

type Product = { id: string; stock: number }
type Order = { id: string; total: number; status: string; isPaid: boolean; createdAt: string; shippingAddress: { name: string } }
type Partner = { id: string }

function StatCard({ icon: Icon, label, value, accent }: {
  icon: typeof PackageIcon; label: string; value: string; accent: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-5">
      <div className={`size-10 rounded-xl flex items-center justify-center mb-3 ${accent}`}>
        <Icon className="size-5" />
      </div>
      <p className="text-2xl font-semibold text-zinc-900">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  Placed: 'bg-blue-100 text-blue-800',
  Confirmed: 'bg-amber-100 text-amber-800',
  Assigned: 'bg-indigo-100 text-indigo-800',
  'Out for Delivery': 'bg-purple-100 text-purple-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
}

export default function AdminDashboard() {
  const { token } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiRequest('/products').then(setProducts),
      apiRequest('/orders', { token: token ?? undefined }).then(setOrders),
      apiRequest('/delivery-partners', { token: token ?? undefined }).then(setPartners),
    ]).finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return <div className="p-10 text-center font-bold">Loading dashboard…</div>
  }

  const totalRevenue = orders.filter(o => o.isPaid).reduce((sum, o) => sum + o.total, 0)
  const outOfStock = products.filter(p => (p.stock ?? 0) === 0).length
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="p-4 md:p-8 bg-neutral-50 min-h-screen">
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={ShoppingBagIcon} label="Total Orders" value={String(orders.length)} accent="bg-indigo-100 text-indigo-700" />
        <StatCard icon={PackageIcon} label="Total Products" value={String(products.length)} accent="bg-blue-100 text-blue-700" />
        <StatCard icon={TruckIcon} label="Delivery Partners" value={String(partners.length)} accent="bg-purple-100 text-purple-700" />
        <StatCard icon={AlertTriangleIcon} label="Out of Stock" value={String(outOfStock)} accent="bg-red-100 text-red-700" />
        <StatCard icon={BanknoteIcon} label="Revenue (Paid)" value={`₦${totalRevenue.toLocaleString()}`} accent="bg-green-100 text-green-700" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Recent Orders</h2>
          <Link to="/admin/orders" className="text-xs font-medium text-indigo-600 flex items-center gap-1 hover:underline">
            View all <ArrowRightIcon className="size-3.5" />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="px-6 py-8 text-center text-zinc-500 text-sm">No orders yet.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {recentOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between px-6 py-3.5">
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    #{o.id.slice(-8).toUpperCase()} — {o.shippingAddress.name}
                  </p>
                  <p className="text-xs text-zinc-400">{new Date(o.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">₦{o.total.toLocaleString()}</span>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${STATUS_STYLES[o.status] || 'bg-zinc-100'}`}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}





