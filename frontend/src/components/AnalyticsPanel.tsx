import { animate, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

function StatCard({
  label,
  value,
  suffix = '',
  delay = 0,
}: {
  label: string
  value: number
  suffix?: string
  delay?: number
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animate(0, value, {
      delay,
      duration: 1.35,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [value, delay])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.35, duration: 0.4 }}
      whileHover={{ y: -2 }}
      className="rounded-xl border border-white/5 bg-[#16213e] p-3 shadow-inner shadow-black/30"
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-white/45">
        {label}
      </p>
      <motion.p
        className="mt-1 flex items-baseline gap-0.5 text-2xl font-bold tabular-nums text-white"
        layout
      >
        <span>{display}</span>
        {suffix ? (
          <span className="text-sm font-semibold text-[#6c63ff]">{suffix}</span>
        ) : null}
      </motion.p>
    </motion.div>
  )
}

export function AnalyticsPanel({
  activeDrivers,
  pendingOrders,
  completedToday,
}: {
  activeDrivers: number
  pendingOrders: number
  completedToday: number
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
        Analytics
      </h2>
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Active" value={activeDrivers} delay={0} />
        <StatCard label="Pending" value={pendingOrders} delay={0.12} />
        <StatCard label="Today" value={completedToday} suffix="+" delay={0.24} />
      </div>
    </section>
  )
}
