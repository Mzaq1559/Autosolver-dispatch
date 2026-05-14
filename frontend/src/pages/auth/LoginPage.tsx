import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignIn = () => {
    console.log({ email, password })
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
        <h1 className="mt-6 text-center text-2xl font-bold text-white">Welcome Back</h1>
        <p className="mt-1 text-center text-white/50">Sign in to your account</p>

        <div className="mt-8 flex flex-col gap-4">
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
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#16213e] px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#6c63ff]/40"
          />
        </div>

        <button
          type="button"
          onClick={handleSignIn}
          className="mt-6 w-full rounded-xl bg-[#6c63ff] py-3 font-bold text-white transition hover:shadow-[0_0_24px_rgba(108,99,255,0.55)] focus:outline-none focus:ring-2 focus:ring-[#6c63ff]/60"
        >
          Sign In
        </button>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="shrink-0 text-sm text-white/30">or continue with</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-medium text-black transition hover:bg-white/95"
        >
          <span className="text-lg font-bold text-[#4285F4]">G</span>
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-white/50">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-[#6c63ff] hover:underline">
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
