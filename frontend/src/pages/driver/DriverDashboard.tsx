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

import React, { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, TileLayer, Polyline } from 'react-leaflet'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'

const CARTO_DARK =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

type DriverAvailability = 'available' | 'busy'
type OrderDeliveryStatus = 'pending' | 'accepted' | 'picked_up' | 'delivered' | 'assigned'

type OrderDef = {
  id: number
  customer_name: string
  restaurant_name: string
  status: OrderDeliveryStatus
  pickup_lat: number
  pickup_lng: number
  delivery_lat: number
  delivery_lng: number
  distanceKm?: string
}

/** Xinzhou center — driver marker */
const DRIVER_POSITION: [number, number] = [38.4167, 112.7333]

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

function pickupIcon(): L.DivIcon {
  return L.divIcon({
    className: 'driver-dash-marker',
    html: `<div style="width:12px;height:12px;border-radius:9999px;background:#ff6b6b;border:2px solid #0f0f1a;box-shadow:0 0 0 2px #ff6b6b44"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function statusBadge(status: OrderDeliveryStatus) {
  switch (status) {
    case 'pending':
    case 'assigned':
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

function orderCardBorderClass(status: OrderDeliveryStatus) {
  switch (status) {
    case 'picked_up':
      return 'border-l-yellow-400'
    case 'accepted':
      return 'border-l-blue-400'
    case 'delivered':
      return 'border-l-green-400'
    default:
      return 'border-l-white/20'
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

export default function DriverDashboard() {
  const { user, logout } = useAuth()
  const [availability, setAvailability] = useState<DriverAvailability>('available')
  const [driverId, setDriverId] = useState<number | null>(null)
  const [orders, setOrders] = useState<OrderDef[]>([])
  const [routes, setRoutes] = useState<Record<number, [number, number][]>>({})

  const driverIcon = useMemo(() => driverTealIcon(), [])
  const dropIcon = useMemo(() => dropoffIcon(), [])
  const pickIcon = useMemo(() => pickupIcon(), [])

  // Fetch current driver ID based on user.id
  useEffect(() => {
    if (!user) return
    api.getDrivers()
      .then((drivers: any[]) => {
        const myDriver = drivers.find((d) => d.user_id === user.id)
        if (myDriver) {
          setDriverId(myDriver.id)
        }
      })
      .catch(err => console.error("Failed to fetch drivers", err))
  }, [user])

  // Poll for orders
  useEffect(() => {
    if (!driverId) return

    const fetchOrders = () => {
      api.getOrders()
        .then((allOrders: any[]) => {
          const myOrders = allOrders.filter(
            (o) => o.driver_id === driverId && o.status !== 'delivered'
          )
          setOrders(myOrders)
        })
        .catch(err => console.error("Failed to fetch orders", err))
    }

    fetchOrders()
    const interval = setInterval(fetchOrders, 3000)
    return () => clearInterval(interval)
  }, [driverId])

  // Fetch OSRM routes for active orders
  useEffect(() => {
    orders.forEach(order => {
      if (!routes[order.id]) {
        const lon1 = order.pickup_lng
        const lat1 = order.pickup_lat
        const lon2 = order.delivery_lng
        const lat2 = order.delivery_lat
        
        fetch(`https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`)
          .then(res => res.json())
          .then(data => {
            if (data.routes && data.routes.length > 0) {
              const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]])
              setRoutes(prev => ({ ...prev, [order.id]: coords }))
            }
          })
          .catch(err => console.error("Failed to fetch route for order", order.id, err))
      }
    })
  }, [orders, routes])

  const activeCount = orders.length

  const advance = async (id: number, current: OrderDeliveryStatus) => {
    let nextStatus = current
    if (current === 'assigned' || current === 'pending') nextStatus = 'accepted'
    else if (current === 'accepted') nextStatus = 'picked_up'
    else if (current === 'picked_up') nextStatus = 'delivered'

    if (nextStatus !== current) {
      try {
        await api.updateOrderStatus(id, nextStatus)
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: nextStatus as OrderDeliveryStatus } : o))
      } catch (err) {
        console.error("Failed to update status", err)
      }
    }
  }

  const labelForAdvance = (current: OrderDeliveryStatus) => {
    if (current === 'assigned' || current === 'pending') return 'Accept'
    if (current === 'accepted') return 'Picked Up'
    if (current === 'picked_up') return 'Delivered'
    return null
  }

  const buttonClassForAdvance = (current: OrderDeliveryStatus) => {
    if (current === 'assigned' || current === 'pending')
      return 'rounded-lg border border-blue-400/40 bg-blue-500/20 px-3 py-2 text-xs font-medium text-blue-200 hover:bg-blue-500/30 sm:text-sm'
    if (current === 'accepted')
      return 'rounded-lg border border-amber-400/50 bg-amber-400/20 px-3 py-2 text-xs font-medium text-amber-100 hover:bg-amber-400/30 sm:text-sm'
    if (current === 'picked_up')
      return 'rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-200 hover:bg-emerald-500/30 sm:text-sm'
    return ''
  }

  return (
    <motion.div
      className="box-border flex h-screen min-h-0 w-full max-w-none flex-col overflow-hidden bg-[#0f0f1a] pt-[60px] text-white"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <style>{`
        .leaflet-div-icon.driver-dash-marker {
          background: transparent !important;
          border: none !important;
        }
        .driver-dashboard-map .leaflet-container {
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
            <span className="truncate text-sm text-white/90">{user?.name || 'Driver'}</span>
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-[#00d4aa] shadow-[0_0_8px_#00d4aa88]"
              title="Online"
              aria-hidden
            />
          </div>
          <button
            onClick={logout}
            className="shrink-0 text-sm text-white/50 transition-colors hover:text-white"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-row">
        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="box-border flex h-full min-h-0 w-[380px] shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-white/5 bg-[#1a1a2e]"
        >
          <div className="flex flex-col gap-4 p-4 pb-6">
            <div className="m-3 rounded-2xl bg-[#16213e] p-4">
              <div className="flex gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#00d4aa] text-lg font-bold text-[#0f0f1a]">
                  {user?.name?.[0]?.toUpperCase() || 'D'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-white">{user?.name || 'Driver'}</p>
                  <p className="truncate text-sm text-white/50">{user?.email}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAvailability('available')}
                  className={
                    availability === 'available'
                      ? 'rounded-lg border border-[#00d4aa] bg-[#00d4aa]/20 px-2 py-2 text-xs font-medium text-[#00d4aa] sm:text-sm'
                      : 'rounded-lg border border-white/10 bg-[#0f0f1a]/40 px-2 py-2 text-xs font-medium text-white/40 sm:text-sm'
                  }
                >
                  🟢 Available
                </button>
                <button
                  type="button"
                  onClick={() => setAvailability('busy')}
                  className={
                    availability === 'busy'
                      ? 'rounded-lg border border-[#ff6b6b] bg-[#ff6b6b]/20 px-2 py-2 text-xs font-medium text-[#ff6b6b] sm:text-sm'
                      : 'rounded-lg border border-white/10 bg-[#0f0f1a]/40 px-2 py-2 text-xs font-medium text-white/40 sm:text-sm'
                  }
                >
                  🔴 Busy
                </button>
              </div>
            </div>

            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2 pl-4 pr-1">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6c63ff]">
                  My Deliveries
                </h2>
                <span className="shrink-0 rounded-full bg-[#6c63ff]/25 px-2.5 py-0.5 text-xs font-semibold text-[#b8b3ff]">
                  {activeCount}
                </span>
              </div>

              <motion.ul
                className="list-none space-y-0 p-0"
                variants={listVariants}
                initial="hidden"
                animate="show"
              >
                {orders.length === 0 && (
                  <p className="p-4 text-center text-sm text-white/40">No active deliveries.</p>
                )}
                {orders.map((order) => {
                  const st = order.status
                  const advanceLabel = labelForAdvance(st)
                  const borderL = orderCardBorderClass(st)
                  return (
                    <motion.li key={order.id} variants={cardVariants} className="list-none">
                      <article
                        className={`relative mb-2 rounded-xl border border-white/5 bg-[#16213e] p-4 last:mb-0 border-l-4 ${borderL}`}
                      >
                        <div className="mb-3 flex items-start justify-between gap-2 pr-1">
                          <p className="text-base font-bold text-white">
                            Order #{order.id}
                          </p>
                          <div className="shrink-0">{statusBadge(st)}</div>
                        </div>
                        <p className="mb-2 text-sm text-white/55">
                          <span className="text-white/45">Customer</span>{' '}
                          <span className="text-white/90">{order.customer_name}</span>
                        </p>
                        <div className="mb-1.5 flex gap-2 text-sm text-white/80">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#ff6b6b]" />
                          <span>
                            <span className="text-white/45">Pickup</span>{' '}
                            {order.restaurant_name}
                          </span>
                        </div>
                        <div className="mb-2 flex gap-2 text-sm text-white/80">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#6c63ff]" />
                          <span>
                            <span className="text-white/45">Dropoff</span>{' '}
                            LatLng: {(order.delivery_lat ?? 0).toFixed(4)}, {(order.delivery_lng ?? 0).toFixed(4)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {advanceLabel ? (
                            <button
                              type="button"
                              className={buttonClassForAdvance(st)}
                              onClick={() => advance(order.id, st)}
                            >
                              {advanceLabel}
                            </button>
                          ) : null}
                        </div>
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
          className="driver-dashboard-map relative h-full min-h-0 min-w-0 flex-1 bg-[#0f0f1a]"
        >
          <div className="absolute inset-0 h-full w-full">
            <MapContainer
              center={DRIVER_POSITION}
              zoom={13}
              className="z-0 h-full w-full min-h-0"
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url={CARTO_DARK}
              />
              <Marker position={DRIVER_POSITION} icon={driverIcon} />
              {orders.map((o) => (
                <React.Fragment key={o.id}>
                  <Marker position={[o.pickup_lat, o.pickup_lng]} icon={pickIcon} />
                  <Marker position={[o.delivery_lat, o.delivery_lng]} icon={dropIcon} />
                  {routes[o.id] && (
                    <Polyline positions={routes[o.id]} color="#6c63ff" weight={4} opacity={0.7} />
                  )}
                </React.Fragment>
              ))}
            </MapContainer>
          </div>
        </motion.main>
      </div>
    </motion.div>
  )
}
