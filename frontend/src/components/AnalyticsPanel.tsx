import { animate, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

function StatCard({
  label,
  value,
  suffix = '',
  delay = 0,
  icon,
}: {
  label: string
  value: number
  suffix?: string
  delay?: number
  icon: string
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
      className="flex flex-col items-center rounded-xl bg-[#16213e] px-2 py-3 text-center"
    >
      <span className="text-xl leading-none" aria-hidden>
        {icon}
      </span>
      <motion.p
        className="mt-2 flex items-baseline justify-center gap-0.5 text-2xl font-bold tabular-nums text-white"
        layout
      >
        <span>{display}</span>
        {suffix ? (
          <span className="text-lg font-bold text-white">{suffix}</span>
        ) : null}
      </motion.p>
      <p className="mt-1 text-[11px] font-medium text-white/45">{label}</p>
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
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6c63ff]">
        Analytics
      </h2>
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Active" value={activeDrivers} delay={0} icon="🚴" />
        <StatCard label="Pending" value={pendingOrders} delay={0.12} icon="⏳" />
        <StatCard
          label="Today"
          value={completedToday}
          suffix="+"
          delay={0.24}
          icon="📦"
        />
      </div>
    </section>
  )
}
