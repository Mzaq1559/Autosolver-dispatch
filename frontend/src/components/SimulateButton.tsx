import { motion } from 'framer-motion'

export function SimulateButton({ onClick }: { onClick?: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      className="fixed bottom-6 right-6 left-auto top-auto z-[9999] overflow-visible rounded-full bg-[#6c63ff] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#6c63ff]/40 outline-none ring-2 ring-[#6c63ff]/50 ring-offset-2 ring-offset-[#0f0f1a]"
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 rounded-full bg-[#6c63ff]"
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(108, 99, 255, 0.55)',
            '0 0 0 14px rgba(108, 99, 255, 0)',
          ],
        }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 rounded-full bg-[#6c63ff]/35 blur-md"
        animate={{ opacity: [0.45, 0.9, 0.45], scale: [1, 1.08, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="relative z-10">Simulate</span>
    </motion.button>
  )
}
