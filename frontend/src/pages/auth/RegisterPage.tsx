import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'

type Role = 'Owner' | 'Driver' | 'Customer'

const roles: { role: Role; emoji: string; label: string }[] = [
  { role: 'Owner', emoji: '🏢', label: 'Owner' },
  { role: 'Driver', emoji: '🚴', label: 'Driver' },
  { role: 'Customer', emoji: '👤', label: 'Customer' },
]

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role>('Owner')

  const handleCreateAccount = () => {
    console.log({ name, email, password, role: selectedRole })
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0f0f1a] p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md rounded-2xl border border-[#6c63ff]/20 bg-[#1a1a2e] p-10"
      >
        <div className="text-center text-2xl font-bold text-white">⚡ AutoSolver</div>
        <h1 className="mt-6 text-center text-2xl font-bold text-white">Create Account</h1>
        <p className="mt-1 text-center text-white/50">Join AutoSolver today</p>

        <div className="mt-8 flex flex-col gap-4">
          <input
            type="text"
            autoComplete="name"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#6c63ff]/40"
          />
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#6c63ff]/40"
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#6c63ff]/40"
          />
        </div>

        <p className="mt-6 text-sm font-medium text-white/50">I am a</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {roles.map(({ role, emoji, label }, i) => {
            const selected = selectedRole === role
            return (
              <motion.button
                key={role}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.08 + i * 0.08, ease: 'easeOut' }}
                onClick={() => setSelectedRole(role)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-4 text-center transition ${
                  selected
                    ? 'border-[#6c63ff] bg-[#6c63ff]/10'
                    : 'border-white/10 bg-[#16213e] hover:border-white/20'
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  {emoji}
                </span>
                <span className="text-xs font-medium text-white">{label}</span>
              </motion.button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={handleCreateAccount}
          className="mt-8 w-full rounded-xl bg-[#6c63ff] py-3 font-bold text-white transition hover:shadow-[0_0_24px_rgba(108,99,255,0.55)] focus:outline-none focus:ring-2 focus:ring-[#6c63ff]/60"
        >
          Create Account
        </button>

        <p className="mt-8 text-center text-sm text-white/50">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[#6c63ff] hover:underline">
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
