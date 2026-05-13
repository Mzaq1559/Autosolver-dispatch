import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'

import { AnalyticsPanel } from './components/AnalyticsPanel'
import type { Driver } from './components/DriversPanel'
import { DriversPanel } from './components/DriversPanel'
import { MapView } from './components/MapView'
import { Navbar } from './components/Navbar'
import type { Order } from './components/OrdersPanel'
import { OrdersPanel } from './components/OrdersPanel'
import { SimulateButton } from './components/SimulateButton'

function OwnerDashboard() {
  const [drivers] = useState<Driver[]>([
    {
      id: 1,
      name: 'Ali Hassan',
      lat: 31.5204,
      lng: 74.3587,
      status: 'available',
    },
    {
      id: 2,
      name: 'Usman Khan',
      lat: 31.5304,
      lng: 74.3687,
      status: 'busy',
    },
    {
      id: 3,
      name: 'Bilal Ahmed',
      lat: 31.5104,
      lng: 74.3487,
      status: 'available',
    },
  ])

  const [orders] = useState<Order[]>([
    {
      id: 1,
      customer: 'Sara Malik',
      restaurant: 'Pizza Point',
      status: 'assigned',
      driver: 'Ali Hassan',
    },
    {
      id: 2,
      customer: 'Ahmed Raza',
      restaurant: 'Burger Lab',
      status: 'pending',
      driver: null,
    },
  ])

  const activeDrivers = useMemo(
    () => drivers.filter((d) => d.status === 'available').length,
    [drivers],
  )
  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === 'pending').length,
    [orders],
  )
  const completedToday = 24

  return (
    <div className="box-border flex h-screen min-h-0 w-full max-w-none flex-col overflow-hidden bg-[#0f0f1a] pt-[60px] text-white">
      <Navbar />
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-row">
        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="box-border flex h-full min-h-0 w-[380px] shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-white/5 bg-[#1a1a2e]"
        >
          <div className="flex flex-col gap-4 p-4">
            <AnalyticsPanel
              activeDrivers={activeDrivers}
              pendingOrders={pendingOrders}
              completedToday={completedToday}
            />
            <DriversPanel drivers={drivers} />
            <OrdersPanel orders={orders} />
          </div>
        </motion.aside>
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="relative h-full min-h-0 min-w-0 flex-1 bg-[#0f0f1a]"
        >
          <MapView drivers={drivers} orders={orders} />
        </motion.main>
      </div>
      <SimulateButton />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/owner" element={<OwnerDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
