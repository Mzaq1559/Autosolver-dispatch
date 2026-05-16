import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSignIn = async () => {
    try {
      setError('')
      setIsLoading(true)
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      if (!response.ok) {
        throw new Error('Invalid email or password')
      }

      const userData = await response.json()
      login(userData)
      navigate(`/${userData.role}`)
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in')
    } finally {
      setIsLoading(false)
    }
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

        {error && (
          <div className="mt-6 rounded-xl bg-red-500/10 p-4 text-center text-sm font-medium text-red-500 border border-red-500/20">
            {error}
          </div>
        )}

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
          disabled={isLoading}
          className="mt-6 w-full rounded-xl bg-[#6c63ff] py-3 font-bold text-white transition hover:shadow-[0_0_24px_rgba(108,99,255,0.55)] focus:outline-none focus:ring-2 focus:ring-[#6c63ff]/60 disabled:opacity-50 disabled:hover:shadow-none"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
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
