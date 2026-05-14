/* eslint-disable @typescript-eslint/ban-ts-comment -- leaflet icon shim */
// @ts-nocheck
import L from 'leaflet'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'

const CARTO_DARK =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

/** Lahore center — customer marker */
const CUSTOMER_POSITION: [number, number] = [31.5204, 74.3587]

type CustomerOrderStatus = 'delivered' | 'on_the_way' | 'pending'

type CustomerOrder = {
  id: string
  number: string
  status: CustomerOrderStatus
  from: string
  to: string
  driver: string | null
  timeLabel: string
  /** Teal driver marker for active (non-delivered) orders with an assigned driver */
  driverLatLng?: [number, number]
}

const INITIAL_ORDERS: CustomerOrder[] = [
  {
    id: 'c1',
    number: '#1043',
    status: 'delivered',
    from: 'Pizza Point, Gulberg',
    to: 'DHA Phase 5',
    driver: 'Ali Hassan',
    timeLabel: '28 min',
  },
  {
    id: 'c2',
    number: '#1042',
    status: 'on_the_way',
    from: 'Burger Lab, MM Alam',
    to: 'Johar Town',
    driver: 'Usman Khan',
    timeLabel: 'Est. 12 min',
    driverLatLng: [31.498, 74.32],
  },
  {
    id: 'c3',
    number: '#1041',
    status: 'pending',
    from: 'KFC, Liberty',
    to: 'Gulberg III',
    driver: null,
    timeLabel: 'Waiting...',
  },
]

function customerPurpleIcon(): L.DivIcon {
  return L.divIcon({
    className: 'customer-dash-marker',
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:#6c63ff;border:2px solid #0f0f1a;box-shadow:0 0 0 2px #6c63ff55"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function driverTealIcon(): L.DivIcon {
  return L.divIcon({
    className: 'customer-dash-marker',
    html: `<div style="width:14px;height:14px;border-radius:9999px;background:#00d4aa;border:2px solid #0f0f1a;box-shadow:0 0 0 2px #00d4aa55"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function statusBadge(status: CustomerOrderStatus) {
  switch (status) {
    case 'delivered':
      return (
        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
          Delivered
        </span>
      )
    case 'on_the_way':
      return (
        <span className="rounded-full border border-amber-400/50 bg-amber-400/20 px-2.5 py-0.5 text-xs font-medium text-amber-200">
          On the way
        </span>
      )
    case 'pending':
      return (
        <span className="rounded-full border border-white/15 bg-[#16213e] px-2.5 py-0.5 text-xs font-medium text-white/60">
          Pending
        </span>
      )
  }
}

function orderCardBorderClass(status: CustomerOrderStatus) {
  switch (status) {
    case 'delivered':
      return 'border-l-green-400'
    case 'on_the_way':
      return 'border-l-yellow-400'
    case 'pending':
      return 'border-l-gray-500'
  }
}

const pageVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
}

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 28 },
  },
}

export default function CustomerDashboard() {
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [orders, setOrders] = useState<CustomerOrder[]>(INITIAL_ORDERS)
  const [nextNum, setNextNum] = useState(1044)

  const customerIcon = useMemo(() => customerPurpleIcon(), [])
  const driverIcon = useMemo(() => driverTealIcon(), [])

  const activeDriverMarkers = useMemo(
    () =>
      orders.filter(
        (o) => o.status !== 'delivered' && o.driverLatLng != null,
      ),
    [orders],
  )

  const placeOrder = () => {
    console.log({ pickup, dropoff })
    const id = `c-${nextNum}`
    setOrders((prev) => [
      {
        id,
        number: `#${nextNum}`,
        status: 'pending',
        from: pickup.trim() || '—',
        to: dropoff.trim() || '—',
        driver: null,
        timeLabel: 'Waiting...',
      },
      ...prev,
    ])
    setNextNum((n) => n + 1)
    setPickup('')
    setDropoff('')
  }

  return (
    <motion.div
      className="box-border flex h-screen min-h-0 w-full max-w-none flex-col overflow-hidden bg-[#0f0f1a] pt-[60px] text-white"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <style>{`
        .leaflet-div-icon.customer-dash-marker {
          background: transparent !important;
          border: none !important;
        }
        .customer-dashboard-map .leaflet-container {
          height: 100%;
          min-height: 100%;
          width: 100%;
          background: #0f0f1a;
        }
      `}</style>

      <header className="fixed left-0 right-0 top-0 z-[1000] flex h-[60px] w-full shrink-0 items-center justify-between border-b border-[#6c63ff]/20 bg-[#1a1a2e] px-4">
        <span className="truncate text-sm font-semibold tracking-tight sm:text-base">
          ⚡ AutoSolver
        </span>
        <div className="flex items-center gap-3">
          <div className="flex max-w-[min(45vw,12rem)] items-center gap-2 sm:max-w-none">
            <span className="truncate text-sm text-white/90">Sara Malik</span>
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-[#00d4aa] shadow-[0_0_8px_#00d4aa88]"
              title="Online"
              aria-hidden
            />
          </div>
          <Link
            to="/login"
            className="shrink-0 text-sm text-white/50 transition-colors hover:text-white"
          >
            Logout
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-row">
        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="box-border flex h-full min-h-0 w-[380px] shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-white/5 bg-[#1a1a2e]"
        >
          <div className="flex flex-col gap-4 pb-6">
            <div className="m-3 rounded-2xl bg-[#16213e] p-4">
              <h2 className="mb-3 text-lg font-bold text-white">New Order</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Enter pickup address"
                  className="w-full rounded-xl border border-white/10 bg-[#0f0f1a] px-4 py-3 text-white placeholder:text-white/35"
                />
                <input
                  type="text"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  placeholder="Enter dropoff address"
                  className="w-full rounded-xl border border-white/10 bg-[#0f0f1a] px-4 py-3 text-white placeholder:text-white/35"
                />
                <button
                  type="button"
                  onClick={placeOrder}
                  className="w-full rounded-xl bg-[#6c63ff] py-3 text-center text-base font-bold text-white transition-opacity hover:opacity-95"
                >
                  Place Order
                </button>
              </div>
            </div>

            <section className="space-y-2 px-1">
              <div className="flex items-center justify-between gap-2 pl-4 pr-4">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6c63ff]">
                  My Orders
                </h2>
                <span className="shrink-0 rounded-full bg-[#6c63ff]/25 px-2.5 py-0.5 text-xs font-semibold text-[#b8b3ff]">
                  {orders.length}
                </span>
              </div>

              <motion.ul
                className="list-none space-y-0 p-0 px-3"
                variants={listVariants}
                initial="hidden"
                animate="show"
              >
                {orders.map((order) => {
                  const borderL = orderCardBorderClass(order.status)
                  return (
                    <motion.li key={order.id} variants={cardVariants} className="list-none">
                      <article
                        className={`relative mb-2 rounded-xl border border-white/5 bg-[#16213e] p-4 last:mb-0 border-l-[3px] ${borderL}`}
                      >
                        <div className="mb-3 flex items-start justify-between gap-2 pr-1">
                          <p className="text-base font-bold text-white">
                            Order {order.number}
                          </p>
                          <div className="shrink-0">{statusBadge(order.status)}</div>
                        </div>
                        <div className="mb-1.5 flex gap-2 text-sm text-white/80">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#a855f7]" />
                          <span>
                            <span className="text-white/45">From</span> {order.from}
                          </span>
                        </div>
                        <div className="mb-2 flex gap-2 text-sm text-white/80">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#00d4aa]" />
                          <span>
                            <span className="text-white/45">To</span> {order.to}
                          </span>
                        </div>
                        <p
                          className={
                            order.driver
                              ? 'mb-1 text-xs text-[#00d4aa]/90'
                              : 'mb-1 text-xs text-white/45'
                          }
                        >
                          Driver: {order.driver ?? 'Not assigned yet'}
                        </p>
                        <p className="mb-3 text-xs text-white/40">{order.timeLabel}</p>
                        {order.status !== 'delivered' ? (
                          <button
                            type="button"
                            className="rounded-lg border border-[#6c63ff]/50 bg-transparent px-3 py-1.5 text-xs font-medium text-[#b8b3ff] hover:border-[#6c63ff] hover:bg-[#6c63ff]/10"
                            onClick={() => window.alert(`Track ${order.number} (coming soon)`)}
                          >
                            Track Order
                          </button>
                        ) : null}
                      </article>
                    </motion.li>
                  )
                })}
              </motion.ul>
            </section>
          </div>
        </motion.aside>

        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="customer-dashboard-map relative h-full min-h-0 min-w-0 flex-1 bg-[#0f0f1a]"
        >
          <div className="absolute inset-0 h-full w-full">
            <MapContainer
              center={CUSTOMER_POSITION}
              zoom={13}
              className="z-0 h-full w-full min-h-0"
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url={CARTO_DARK}
              />
              <Marker position={CUSTOMER_POSITION} icon={customerIcon} />
              {activeDriverMarkers.map((o) => (
                <Marker key={o.id} position={o.driverLatLng} icon={driverIcon} />
              ))}
            </MapContainer>
          </div>
        </motion.main>
      </div>
    </motion.div>
  )
}
