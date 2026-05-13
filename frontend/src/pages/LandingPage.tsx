import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const easeOut = [0.22, 1, 0.36, 1] as const

const heroTitle = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: easeOut },
  },
}

const heroSubtitle = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOut, delay: 0.18 },
  },
}

const heroActions = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut, delay: 0.36 },
  },
}

const featureContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
}

const featureCard = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOut },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
}

const PARTICLES: { left: string; top: string; delay: string; size: number }[] = [
  { left: '8%', top: '18%', delay: '0s', size: 3 },
  { left: '22%', top: '72%', delay: '1.2s', size: 2 },
  { left: '78%', top: '28%', delay: '0.6s', size: 4 },
  { left: '88%', top: '65%', delay: '2.1s', size: 2 },
  { left: '14%', top: '48%', delay: '1.8s', size: 3 },
  { left: '52%', top: '12%', delay: '0.9s', size: 2 },
  { left: '64%', top: '82%', delay: '1.4s', size: 3 },
  { left: '38%', top: '36%', delay: '2.4s', size: 2 },
  { left: '92%', top: '42%', delay: '0.3s', size: 4 },
  { left: '44%', top: '58%', delay: '1.6s', size: 2 },
]

export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes landing-float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.35; }
          50% { transform: translateY(-18px) translateX(6px); opacity: 0.85; }
        }
        @keyframes landing-drift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .landing-particle {
          position: absolute;
          border-radius: 9999px;
          background: radial-gradient(circle at 30% 30%, #00d4aa, #6c63ff 55%, transparent 70%);
          filter: blur(0.5px);
          animation: landing-float 7s ease-in-out infinite;
          pointer-events: none;
        }
        .landing-grid-bg {
          background-image:
            linear-gradient(rgba(108, 99, 255, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(108, 99, 255, 0.07) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, black 10%, transparent 75%);
        }
      `}</style>

      <div
        id="top"
        className="scroll-smooth bg-[#0f0f1a] font-[Inter,system-ui,sans-serif] text-white antialiased"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#0f0f1a]/80 backdrop-blur-md">
          <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:h-[4.25rem] sm:px-8">
            <Link
              to="/"
              className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white transition hover:text-[#c4bfff]"
            >
              <span className="text-xl" aria-hidden>
                ⚡
              </span>
              AutoSolver
            </Link>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition hover:text-white sm:px-4"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-[#6c63ff] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_-4px_rgba(108,99,255,0.65)] transition hover:bg-[#5a52e6] sm:px-5"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </header>

        <main>
          {/* Hero */}
          <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-28 sm:px-8 sm:pt-32">
            <div className="pointer-events-none absolute inset-0">
              <div className="landing-grid-bg absolute inset-0" aria-hidden />
              <div
                className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(108,99,255,0.28),transparent_55%)]"
                aria-hidden
              />
              {PARTICLES.map((p, i) => (
                <span
                  key={i}
                  className="landing-particle"
                  style={{
                    left: p.left,
                    top: p.top,
                    width: p.size,
                    height: p.size,
                    animationDelay: p.delay,
                    animationDuration: `${6.5 + (i % 4) * 0.8}s`,
                  }}
                  aria-hidden
                />
              ))}
            </div>

            <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: easeOut }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#00d4aa]/25 bg-[#00d4aa]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[#7ef3de]"
              >
                Dispatch, reimagined
              </motion.p>

              <motion.h1
                variants={heroTitle}
                initial="hidden"
                animate="visible"
                className="text-balance text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.08]"
              >
                Deliver Smarter. Not Harder.
              </motion.h1>

              <motion.p
                variants={heroSubtitle}
                initial="hidden"
                animate="visible"
                className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/65 sm:text-lg"
              >
                AutoSolver uses AI to assign drivers, optimize routes, and track deliveries in real
                time.
              </motion.p>

              <motion.div
                variants={heroActions}
                initial="hidden"
                animate="visible"
                className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:max-w-md sm:flex-row sm:items-center"
              >
                <Link
                  to="/register"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-[#6c63ff] px-8 text-sm font-semibold text-white shadow-[0_0_32px_-6px_rgba(108,99,255,0.8)] transition hover:bg-[#5a52e6]"
                >
                  Get Started
                </Link>
                <Link
                  to="#features"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-[#6c63ff]/80 bg-transparent px-8 text-sm font-semibold text-[#d4d0ff] transition hover:border-[#6c63ff] hover:bg-[#6c63ff]/10"
                >
                  See How It Works
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65, duration: 0.6 }}
                className="mt-14 flex items-center gap-6 text-xs text-white/40"
              >
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00d4aa]" />
                  Live routing
                </span>
                <span className="hidden h-4 w-px bg-white/15 sm:block" />
                <span className="hidden items-center gap-2 sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#6c63ff]" />
                  AI dispatch
                </span>
              </motion.div>
            </div>

            <motion.div
              aria-hidden
              className="absolute bottom-10 left-1/2 z-10 hidden -translate-x-1/2 sm:block"
              style={{ animation: 'landing-drift 2.8s ease-in-out infinite' }}
            >
              <div className="h-9 w-5 rounded-full border border-white/20" />
              <div className="mx-auto mt-1.5 h-1.5 w-1 rounded-full bg-white/35" />
            </motion.div>
          </section>

          {/* Features */}
          <section id="features" className="relative border-t border-white/[0.06] px-6 py-24 sm:px-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6c63ff]/40 to-transparent" />
            <div className="mx-auto max-w-6xl">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, ease: easeOut }}
                className="mb-14 max-w-2xl"
              >
                <p className="text-sm font-semibold uppercase tracking-widest text-[#00d4aa]">
                  Why teams switch
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Everything you need to run dispatch at scale
                </h2>
              </motion.div>

              <motion.div
                className="grid gap-6 md:grid-cols-3"
                variants={featureContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
              >
                <motion.article
                  variants={featureCard}
                  className="rounded-2xl border border-[#6c63ff]/20 bg-[#16213e] p-8 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.9)]"
                >
                  <div className="mb-4 text-3xl" aria-hidden>
                    ⚡
                  </div>
                  <h3 className="text-lg font-semibold text-white">Smart Assignment</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">
                    AI assigns the nearest available driver instantly
                  </p>
                </motion.article>
                <motion.article
                  variants={featureCard}
                  className="rounded-2xl border border-[#6c63ff]/20 bg-[#16213e] p-8 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.9)]"
                >
                  <div className="mb-4 text-3xl" aria-hidden>
                    🗺️
                  </div>
                  <h3 className="text-lg font-semibold text-white">Live Route Optimization</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">
                    Real-time route calculation saving fuel and time
                  </p>
                </motion.article>
                <motion.article
                  variants={featureCard}
                  className="rounded-2xl border border-[#6c63ff]/20 bg-[#16213e] p-8 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.9)]"
                >
                  <div className="mb-4 text-3xl" aria-hidden>
                    📊
                  </div>
                  <h3 className="text-lg font-semibold text-white">Full Analytics</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">
                    Track every delivery, driver, and order in one dashboard
                  </p>
                </motion.article>
              </motion.div>
            </div>
          </section>

          {/* Roles */}
          <section className="border-t border-white/[0.06] px-6 py-24 sm:px-8">
            <div className="mx-auto max-w-6xl">
              <motion.h2
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
                variants={fadeUp}
                className="text-center text-3xl font-bold tracking-tight sm:text-4xl"
              >
                Built For Everyone
              </motion.h2>

              <motion.div
                className="mt-14 grid gap-6 md:grid-cols-3"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.1 } },
                }}
              >
                {[
                  {
                    icon: '🏢',
                    title: 'Owner',
                    body: 'Full dispatch control. Monitor everything in real time.',
                  },
                  {
                    icon: '🚴',
                    title: 'Driver',
                    body: 'See your deliveries. Navigate your route. Update status.',
                  },
                  {
                    icon: '👤',
                    title: 'Customer',
                    body: 'Place orders. Track delivery. Know exactly when it arrives.',
                  },
                ].map((role) => (
                  <motion.div
                    key={role.title}
                    variants={fadeUp}
                    className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#12182a] p-8"
                  >
                    <span className="text-3xl" aria-hidden>
                      {role.icon}
                    </span>
                    <h3 className="mt-4 text-lg font-semibold">{role.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-white/60">{role.body}</p>
                    <Link
                      to="/register"
                      className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-[#6c63ff] text-sm font-semibold text-white transition hover:bg-[#5a52e6]"
                    >
                      Get Started
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* CTA */}
          <section className="px-6 py-20 sm:px-8 sm:py-28">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, ease: easeOut }}
              className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-[#6c63ff]/30 bg-gradient-to-br from-[#6c63ff]/35 via-[#1a1440] to-[#0f0f1a] px-8 py-16 text-center shadow-[0_40px_120px_-60px_rgba(108,99,255,0.9)] sm:px-14 sm:py-20"
            >
              <div
                className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-[#00d4aa]/20 blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-[#6c63ff]/40 blur-3xl"
                aria-hidden
              />
              <h2 className="relative text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to optimize your deliveries?
              </h2>
              <Link
                to="/register"
                className="relative mt-10 inline-flex h-12 items-center justify-center rounded-xl bg-white px-10 text-sm font-semibold text-[#0f0f1a] transition hover:bg-white/90"
              >
                Start For Free
              </Link>
            </motion.div>
          </section>
        </main>

        <footer className="border-t border-white/[0.06] px-6 py-10 sm:px-8">
          <p className="text-center text-sm text-white/40">AutoSolver © 2026</p>
        </footer>
      </div>
    </>
  )
}
