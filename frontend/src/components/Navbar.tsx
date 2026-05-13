import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

export function Navbar() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="fixed left-0 right-0 top-0 z-[1000] flex h-[60px] shrink-0 items-center justify-between border-b border-white/10 bg-[#1a1a2e] px-4"
    >
      <motion.div
        className="flex items-center gap-2"
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <span className="text-lg font-semibold tracking-tight text-white">
          Auto<span className="text-[#6c63ff]">Solver</span>
        </span>
      </motion.div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#16213e] px-3 py-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <motion.span
              className="absolute inline-flex h-full w-full rounded-full bg-[#00d4aa] opacity-75"
              animate={{ scale: [1, 2.2], opacity: [0.75, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
            />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#00d4aa]" />
          </span>
          <span className="text-xs font-medium text-white/80">Live</span>
        </div>
        <motion.time
          layout
          className="tabular-nums text-sm font-medium text-white/90"
          key={formatTime(now)}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {formatTime(now)}
        </motion.time>
      </div>
    </motion.header>
  )
}
