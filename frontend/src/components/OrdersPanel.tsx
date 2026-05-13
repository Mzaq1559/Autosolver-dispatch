import { motion } from 'framer-motion'

export type OrderStatus = 'assigned' | 'pending'

export interface Order {
  id: number
  customer: string
  restaurant: string
  status: OrderStatus
  driver: string | null
}

const statusStyles: Record<
  OrderStatus,
  { border: string; label: string; accent: string }
> = {
  assigned: {
    border: 'border-[#6c63ff]/40',
    label: 'text-[#6c63ff]',
    accent: 'bg-[#6c63ff]',
  },
  pending: {
    border: 'border-amber-400/35',
    label: 'text-amber-300',
    accent: 'bg-amber-400',
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

export function OrdersPanel({ orders }: { orders: Order[] }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
        Orders
      </h2>
      <motion.ul
        className="list-none space-y-2 p-0"
        variants={list}
        initial="hidden"
        animate="show"
      >
        {orders.map((o) => {
          const s = statusStyles[o.status]
          return (
            <motion.li
              key={o.id}
              variants={row}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              whileHover={{ scale: 1.01 }}
              layout
              className={`rounded-xl border bg-[#16213e] p-3 ${s.border}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{o.customer}</p>
                  <p className="mt-0.5 truncate text-sm text-white/55">
                    {o.restaurant}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    {o.driver ? (
                      <>
                        Driver:{' '}
                        <span className="text-white/70">{o.driver}</span>
                      </>
                    ) : (
                      <span className="italic">Unassigned</span>
                    )}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.label} bg-white/5`}
                >
                  {o.status}
                </span>
              </div>
              <motion.div
                className={`mt-2 h-1 overflow-hidden rounded-full bg-white/5 ${
                  o.status === 'assigned' ? 'ring-1 ring-[#6c63ff]/25' : 'ring-1 ring-amber-400/20'
                }`}
                initial={false}
              >
                <motion.div
                  className={`h-full rounded-full ${s.accent}`}
                  initial={{ width: '0%' }}
                  animate={{ width: o.status === 'assigned' ? '100%' : '35%' }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </motion.div>
            </motion.li>
          )
        })}
      </motion.ul>
    </section>
  )
}
