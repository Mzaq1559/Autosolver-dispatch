import { motion } from 'framer-motion'

export type DriverStatus = 'available' | 'busy'

export interface Driver {
  id: number
  name: string
  lat: number
  lng: number
  status: DriverStatus
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 380, damping: 28 },
  },
}

function StatusBadge({ status }: { status: DriverStatus }) {
  const isAvailable = status === 'available'
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize text-white ${
        isAvailable ? 'bg-[#00d4aa]' : 'bg-[#ff6b6b]'
      }`}
    >
      {status}
    </span>
  )
}

export function DriversPanel({ drivers }: { drivers: Driver[] }) {
  return (
    <section className="space-y-2">
      <h2 className="pl-4 text-xs font-semibold uppercase tracking-widest text-[#6c63ff]">
        Drivers
      </h2>
      <motion.ul
        className="list-none space-y-0 p-0"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {drivers.map((d) => {
          const isAvailable = d.status === 'available'
          return (
            <motion.li
              key={d.id}
              variants={item}
              whileHover={
                isAvailable
                  ? {
                      boxShadow:
                        '0 0 20px rgba(0, 212, 170, 0.45), 0 4px 12px rgba(0,0,0,0.25)',
                    }
                  : {
                      boxShadow:
                        '0 0 20px rgba(255, 107, 107, 0.45), 0 4px 12px rgba(0,0,0,0.25)',
                    }
              }
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={`mb-2 rounded-xl border border-white/5 bg-[#16213e] p-4 last:mb-0 border-l-[3px] ${
                isAvailable ? 'border-l-[#00d4aa]' : 'border-l-[#ff6b6b]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold leading-snug text-white">
                    {d.name}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </div>
            </motion.li>
          )
        })}
      </motion.ul>
    </section>
  )
}
