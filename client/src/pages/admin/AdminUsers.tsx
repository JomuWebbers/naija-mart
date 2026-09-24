import { useEffect, useState, useCallback } from 'react'
import { ShieldCheckIcon, ClockIcon, CheckIcon, XIcon, WalletIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/useAuth'
import { apiRequest } from '../../lib/api'

type UserRow = {
  id: string
  name: string
  email: string
  phone: string
  accountBalance: number
  isTrustedVendor: boolean
  trustedVendorRequestStatus: string
  createdAt: string
}

type FilterMode = 'all' | 'pending' | 'trusted'

export default function AdminUsers() {
  const { token } = useAuth()
  const [users, setUsers] = useState<UserRow[] | null>(null)
  const [filter, setFilter] = useState<FilterMode>('all')
  const [actingId, setActingId] = useState<string | null>(null)

  const fetchUsers = useCallback((mode: FilterMode) => {
    const query = mode === 'pending' ? '?pendingOnly=true' : mode === 'trusted' ? '?trustedOnly=true' : ''
    apiRequest(`/users${query}`, { token: token ?? undefined })
      .then(setUsers)
      .catch(() => toast.error('Failed to load users'))
  }, [token])

  useEffect(() => {
    fetchUsers(filter)
  }, [filter, fetchUsers])

  const handleReview = async (id: string, approve: boolean) => {
    setActingId(id)
    try {
      await apiRequest(`/users/${id}/trusted-vendor-request`, {
        method: 'PATCH',
        token: token ?? undefined,
        body: { approve },
      })
      toast.success(approve ? 'Vendor approved' : 'Request rejected')
      fetchUsers(filter)
    } catch {
      toast.error('Failed to update request')
    } finally {
      setActingId(null)
    }
  }

  const FILTERS: { key: FilterMode; label: string }[] = [
    { key: 'all', label: 'All Customers' },
    { key: 'pending', label: 'Pending Requests' },
    { key: 'trusted', label: 'Trusted Vendors' },
  ]

  return (
    <div className="p-4 md:p-8 bg-neutral-50 min-h-screen">
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">Users</h1>

      <div className="flex gap-2 mb-6">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.key ? 'bg-indigo-600 text-white' : 'bg-white text-zinc-600 border border-zinc-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {users === null ? (
        <div className="p-10 text-center font-bold">Loading users…</div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-10 text-center text-zinc-500">
          No users match this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(u => (
            <div key={u.id} className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-full bg-indigo-500 flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">{u.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900">{u.name}</p>
                    <p className="text-xs text-zinc-500">{u.email}</p>
                  </div>
                </div>
                {u.isTrustedVendor && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[10px] font-semibold">
                    <ShieldCheckIcon className="size-3" /> Trusted
                  </span>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-100 space-y-1.5">
                <p className="text-xs text-zinc-600">{u.phone || 'No phone on file'}</p>
                <p className="text-xs text-zinc-600 flex items-center gap-1.5">
                  <WalletIcon className="size-3.5" /> ₦{u.accountBalance.toLocaleString()} balance
                </p>
              </div>

              {u.trustedVendorRequestStatus === 'pending' && (
                <div className="mt-4 pt-4 border-t border-zinc-100">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700 mb-3">
                    <ClockIcon className="size-3.5" /> Requesting Trusted Vendor status
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview(u.id, true)}
                      disabled={actingId === u.id}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckIcon className="size-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleReview(u.id, false)}
                      disabled={actingId === u.id}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50"
                    >
                      <XIcon className="size-3.5" /> Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

