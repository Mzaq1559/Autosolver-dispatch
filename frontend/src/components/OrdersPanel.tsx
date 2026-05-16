import { motion } from 'framer-motion'

export type OrderStatus = 'assigned' | 'pending' | 'delivered'

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
  delivered: {
    badge: 'bg-emerald-500 text-white',
    borderL: 'border-l-[3px] border-l-emerald-500',
  },
}

const list = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const row = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

export function OrdersPanel({ 
  orders, 
  onOrderClick 
}: { 
  orders: Order[]
  onOrderClick?: (order: Order) => void
}) {
  return (
    <section className="space-y-2">
      <h2 className="pl-4 text-xs font-semibold uppercase tracking-widest text-[#6c63ff]">
        Orders
      </h2>
      <motion.ul
        className="list-none space-y-0 p-0"
        variants={list}
        initial="hidden"
        animate="show"
      >
        {orders.map((o) => {
          const s = statusStyles[o.status]
          const glow =
            o.status === 'assigned'
              ? '0 0 20px rgba(108, 99, 255, 0.4), 0 4px 12px rgba(0,0,0,0.25)'
              : o.status === 'pending'
                ? '0 0 20px rgba(251, 191, 36, 0.35), 0 4px 12px rgba(0,0,0,0.25)'
                : '0 0 20px rgba(16, 185, 129, 0.4), 0 4px 12px rgba(0,0,0,0.25)'
          return (
            <motion.li
              key={o.id}
              variants={row}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              whileHover={{ boxShadow: glow }}
              layout
              onClick={() => onOrderClick?.(o)}
              className={`relative mb-2 rounded-xl border border-white/5 bg-[#16213e] p-4 last:mb-0 ${s.borderL} ${onOrderClick && o.status === 'pending' ? 'cursor-pointer hover:bg-[#1a264a]' : ''}`}
            >
              <span
                className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${s.badge}`}
              >
                {o.status}
              </span>
              <div className="min-w-0 pr-20">
                <p className="font-bold leading-snug text-white">{o.customer_name}</p>
                <p className="mt-1 text-sm text-white/50">{o.restaurant_name}</p>
                {o.driver_name ? (
                  <p className="mt-2 text-xs font-medium text-[#00d4aa]">
                    {o.driver_name}
                  </p>
                ) : (
                  <p className="mt-2 text-xs italic text-white/35">Unassigned</p>
                )}
              </div>
            </motion.li>
          )
        })}
      </motion.ul>
    </section>
  )
}
