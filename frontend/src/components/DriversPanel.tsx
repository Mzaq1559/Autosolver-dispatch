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
  hidden: { opacity: 0, x: -12 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring' as const, stiffness: 380, damping: 28 },
  },
}

function StatusBadge({ status }: { status: DriverStatus }) {
  const isAvailable = status === 'available'
  return (
    <span
      className={`relative inline-flex shrink-0 items-center gap-1.5 overflow-hidden rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
        isAvailable
          ? 'bg-[#00d4aa]/15 text-[#00d4aa]'
          : 'bg-[#ff6b6b]/15 text-[#ff6b6b]'
      }`}
    >
      {isAvailable && (
        <motion.span
          className="absolute inset-0 bg-[#00d4aa]/20"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <span className="relative z-10">{status}</span>
    </span>
  )
}

export function DriversPanel({ drivers }: { drivers: Driver[] }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
        Drivers
      </h2>
      <motion.ul
        className="list-none space-y-2 p-0"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {drivers.map((d) => (
          <motion.li
            key={d.id}
            variants={item}
            whileHover={{ scale: 1.01 }}
            className="rounded-xl border border-white/5 bg-[#16213e] p-4 shadow-lg shadow-black/20"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 truncate font-medium text-white">{d.name}</p>
              <StatusBadge status={d.status} />
            </div>
            <p className="mt-2 text-xs text-white/50">
              {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
            </p>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  )
}
