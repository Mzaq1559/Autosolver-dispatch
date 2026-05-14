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

type DriverAvailability = 'available' | 'busy'

type OrderDeliveryStatus = 'pending' | 'accepted' | 'picked_up' | 'delivered'

type OrderDef = {
  id: string
  label: string
  customer: string
  pickup: string
  dropoff: string
  distanceKm: string
  /** Dropoff coordinates for map */
  dropLatLng: [number, number]
}

const ORDERS: OrderDef[] = [
  {
    id: 'o1',
    label: '#1042',
    customer: 'Sara Malik',
    pickup: 'Pizza Point, Gulberg',
    dropoff: 'DHA Phase 5',
    distanceKm: '4.2 km',
    dropLatLng: [31.4685, 74.4175],
  },
  {
    id: 'o2',
    label: '#1041',
    customer: 'Ahmed Raza',
    pickup: 'Burger Lab, MM Alam',
    dropoff: 'Johar Town',
    distanceKm: '6.8 km',
    dropLatLng: [31.4695, 74.2765],
  },
]

const DRIVER_POSITION: [number, number] = [31.5204, 74.3587]

function driverTealIcon(): L.DivIcon {
  return L.divIcon({
    className: 'driver-dash-marker',
    html: `<div style="width:14px;height:14px;border-radius:9999px;background:#00d4aa;border:2px solid #0f0f1a;box-shadow:0 0 0 2px #00d4aa55"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function dropoffIcon(): L.DivIcon {
  return L.divIcon({
    className: 'driver-dash-marker',
    html: `<div style="width:12px;height:12px;border-radius:9999px;background:#6c63ff;border:2px solid #0f0f1a;box-shadow:0 0 0 2px #6c63ff44"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function statusBadge(status: OrderDeliveryStatus) {
  switch (status) {
    case 'pending':
      return (
        <span className="rounded-full border border-white/15 bg-[#16213e] px-2.5 py-0.5 text-xs font-medium text-white/60">
          Pending
        </span>
      )
    case 'accepted':
      return (
        <span className="rounded-full border border-blue-400/40 bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-300">
          Accepted
        </span>
      )
    case 'picked_up':
      return (
        <span className="rounded-full border border-amber-400/50 bg-amber-400/20 px-2.5 py-0.5 text-xs font-medium text-amber-200">
          Picked Up
        </span>
      )
    case 'delivered':
      return (
        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
          Delivered
        </span>
      )
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
    transition: { staggerChildren: 0.08, delayChildren: 0.12 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 28 },
  },
}

export default function DriverDashboard() {
  const [availability, setAvailability] = useState<DriverAvailability>('available')
  const [orderStatus, setOrderStatus] = useState<Record<string, OrderDeliveryStatus>>({
    o1: 'picked_up',
    o2: 'accepted',
  })

  const driverIcon = useMemo(() => driverTealIcon(), [])
  const dropIcon = useMemo(() => dropoffIcon(), [])

  const activeCount = ORDERS.filter((o) => orderStatus[o.id] !== 'delivered').length

  const setOrder = (id: string, next: OrderDeliveryStatus) => {
    setOrderStatus((prev) => ({ ...prev, [id]: next }))
  }

  const advance = (id: string, current: OrderDeliveryStatus) => {
    if (current === 'pending') setOrder(id, 'accepted')
    else if (current === 'accepted') setOrder(id, 'picked_up')
    else if (current === 'picked_up') setOrder(id, 'delivered')
  }

  const labelForAdvance = (current: OrderDeliveryStatus) => {
    if (current === 'pending') return 'Accept'
    if (current === 'accepted') return 'Picked Up'
    if (current === 'picked_up') return 'Delivered'
    return null
  }

  const buttonClassForAdvance = (current: OrderDeliveryStatus) => {
    if (current === 'pending')
      return 'rounded-xl border border-blue-400/40 bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-200 hover:bg-blue-500/30'
    if (current === 'accepted')
      return 'rounded-xl border border-amber-400/50 bg-amber-400/20 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-400/30'
    if (current === 'picked_up')
      return 'rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/30'
    return ''
  }

  return (
    <motion.div
      className="min-h-screen bg-[#0f0f1a] text-white"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <style>{`
        .leaflet-div-icon.driver-dash-marker {
          background: transparent !important;
          border: none !important;
        }
        .driver-mini-map .leaflet-container {
          height: 250px;
          width: 100%;
          background: #0f0f1a;
        }
      `}</style>

      <header className="fixed left-0 right-0 top-0 z-50 flex w-full items-center justify-between border-b border-[#6c63ff]/20 bg-[#1a1a2e] px-4 py-3">
        <span className="text-sm font-semibold tracking-tight sm:text-base">
          ⚡ AutoSolver
        </span>
        <div className="flex items-center gap-3">
          <div className="flex max-w-[min(50vw,11rem)] items-center gap-2 sm:max-w-none">
            <span className="truncate text-sm text-white/90">Ali Hassan</span>
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-[#00d4aa] shadow-[0_0_8px_#00d4aa88]"
              title="Online"
              aria-hidden
            />
          </div>
          <Link
            to="/login"
            className="text-sm text-white/50 transition-colors hover:text-white"
          >
            Logout
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-0 pb-10 pt-14">
        <motion.section
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="mx-4 mt-20 rounded-2xl bg-[#1a1a2e] p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-white">My Status</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAvailability('available')}
              className={
                availability === 'available'
                  ? 'rounded-xl border border-[#00d4aa] bg-[#00d4aa]/20 px-3 py-3 text-sm font-medium text-[#00d4aa]'
                  : 'rounded-xl border border-white/10 bg-[#16213e] px-3 py-3 text-sm font-medium text-white/40'
              }
            >
              🟢 Available
            </button>
            <button
              type="button"
              onClick={() => setAvailability('busy')}
              className={
                availability === 'busy'
                  ? 'rounded-xl border border-[#ff6b6b] bg-[#ff6b6b]/20 px-3 py-3 text-sm font-medium text-[#ff6b6b]'
                  : 'rounded-xl border border-white/10 bg-[#16213e] px-3 py-3 text-sm font-medium text-white/40'
              }
            >
              🔴 Busy
            </button>
          </div>
        </motion.section>

        <motion.div
          className="mt-8 flex flex-col gap-4 px-4"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={cardVariants} className="mb-0 flex items-center gap-2">
            <h2 className="text-lg font-semibold">My Deliveries</h2>
            <span className="rounded-full bg-[#6c63ff]/25 px-2.5 py-0.5 text-xs font-semibold text-[#b8b3ff]">
              {activeCount}
            </span>
          </motion.div>

          {ORDERS.map((order) => {
            const st = orderStatus[order.id] ?? 'pending'
            const advanceLabel = labelForAdvance(st)
            return (
              <motion.article
                key={order.id}
                variants={cardVariants}
                className="rounded-2xl border border-white/5 bg-[#1a1a2e] p-5"
              >
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <p className="text-base font-bold text-white">
                      Order {order.label}
                    </p>
                    {statusBadge(st)}
                  </div>
                  <p className="mb-3 text-sm text-white/55">
                    Customer:{' '}
                    <span className="text-white/85">{order.customer}</span>
                  </p>
                  <div className="mb-2 flex gap-2 text-sm text-white/80">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#a855f7]" />
                    <span>
                      <span className="text-white/45">Pickup</span>{' '}
                      {order.pickup}
                    </span>
                  </div>
                  <div className="mb-3 flex gap-2 text-sm text-white/80">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#00d4aa]" />
                    <span>
                      <span className="text-white/45">Dropoff</span>{' '}
                      {order.dropoff}
                    </span>
                  </div>
                  <p className="mb-4 text-xs text-white/35">{order.distanceKm}</p>

                  <div className="flex flex-wrap gap-2">
                    {advanceLabel ? (
                      <button
                        type="button"
                        className={buttonClassForAdvance(st)}
                        onClick={() => advance(order.id, st)}
                      >
                        {advanceLabel}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-xl border border-[#6c63ff]/50 bg-transparent px-4 py-2 text-sm font-medium text-[#b8b3ff] hover:border-[#6c63ff] hover:bg-[#6c63ff]/10"
                      onClick={() => window.alert('Route preview (coming soon)')}
                    >
                      View Route
                    </button>
                  </div>
              </motion.article>
            )
          })}
        </motion.div>

        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="show"
          className="driver-mini-map mx-4 mt-8 overflow-hidden rounded-2xl border border-white/5"
        >
          <MapContainer
            center={[31.498, 74.345]}
            zoom={11}
            className="z-0 h-[250px] w-full"
            style={{ height: 250, width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url={CARTO_DARK}
            />
            <Marker position={DRIVER_POSITION} icon={driverIcon} />
            {ORDERS.map((o) => (
              <Marker key={o.id} position={o.dropLatLng} icon={dropIcon} />
            ))}
          </MapContainer>
        </motion.div>
      </div>
    </motion.div>
  )
}
