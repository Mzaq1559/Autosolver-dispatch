import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'

export type OrderStatus = 'assigned' | 'pending' | 'completed' | 'cancelled' | 'delivered'

export interface Order {
  id: number
  customer_name: string
  restaurant_name: string
  status: OrderStatus
  driver_name: string | null
}

const statusStyles: Record<
  OrderStatus,
  { badge: string; borderL: string }
> = {
  assigned: {
    badge: 'bg-[#6c63ff] text-white',
    borderL: 'border-l-[3px] border-l-[#6c63ff]',
  },
  pending: {
    badge: 'bg-amber-400 text-[#0f0f1a]',
    borderL: 'border-l-[3px] border-l-amber-400',
  },
  completed: {
    badge: 'bg-emerald-500 text-white',
    borderL: 'border-l-[3px] border-l-emerald-500',
  },
  delivered: {
    badge: 'bg-emerald-500 text-white',
    borderL: 'border-l-[3px] border-l-emerald-500',
  },
  cancelled: {
    badge: 'bg-red-500 text-white',
    borderL: 'border-l-[3px] border-l-red-500',
  },
}

export function OrdersPanel({ 
  orders, 
  onOrderClick 
}: { 
  orders: Order[]
  onOrderClick?: (order: Order) => void
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = 
        o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.toString().includes(searchTerm)
      
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [orders, searchTerm, statusFilter])


  return (
    <section className="flex h-[600px] flex-col space-y-3">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6c63ff]">
          Orders ({filteredOrders.length})
        </h2>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 px-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-white/5 bg-[#0f0f1a] py-2 pl-9 pr-4 text-xs text-white placeholder:text-white/20 focus:border-[#6c63ff]/50 focus:outline-none"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 rounded-lg border border-white/5 bg-[#0f0f1a] p-2 text-xs text-white focus:border-[#6c63ff]/50 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="delivering">Delivering</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          {(searchTerm || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
              }}
              className="flex items-center justify-center rounded-lg bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-4 space-y-3 pb-4">
        {filteredOrders.map((o) => {
          const s = statusStyles[o.status]
          const glow =
            o.status === 'assigned'
              ? '0 0 20px rgba(108, 99, 255, 0.4), 0 4px 12px rgba(0,0,0,0.25)'
              : o.status === 'pending'
                ? '0 0 20px rgba(251, 191, 36, 0.35), 0 4px 12px rgba(0,0,0,0.25)'
                : o.status === 'completed' || o.status === 'delivered'
                  ? '0 0 20px rgba(16, 185, 129, 0.4), 0 4px 12px rgba(0,0,0,0.25)'
                  : '0 0 20px rgba(239, 68, 68, 0.4), 0 4px 12px rgba(0,0,0,0.25)'

          return (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ boxShadow: glow }}
              onClick={() => onOrderClick?.(o)}
              className={`relative rounded-xl border border-white/5 bg-[#16213e] p-4 ${s.borderL} ${onOrderClick && o.status === 'pending' ? 'cursor-pointer hover:bg-[#1a264a]' : ''}`}
            >
              <span
                className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${s.badge}`}
              >
                {o.status}
              </span>
              <div className="min-w-0 pr-20">
                <p className="font-bold leading-snug text-white truncate">#{o.id} {o.customer_name}</p>
                <p className="mt-1 text-sm text-white/50 truncate">{o.restaurant_name}</p>
                {o.driver_name ? (
                  <p className="mt-2 text-xs font-medium text-[#00d4aa]">
                    {o.driver_name}
                  </p>
                ) : (
                  <p className="mt-2 text-xs italic text-white/35">Unassigned</p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
