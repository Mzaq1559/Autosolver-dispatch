import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

import { AnalyticsPanel } from '../../components/AnalyticsPanel'
import { AssignDriverModal } from '../../components/AssignDriverModal'
import { CreateOrderModal } from '../../components/CreateOrderModal'
import type { Driver } from '../../components/DriversPanel'
import { DriversPanel } from '../../components/DriversPanel'
import { MapView } from '../../components/MapView'
import { Navbar } from '../../components/Navbar'
import type { Order } from '../../components/OrdersPanel'
import { OrdersPanel } from '../../components/OrdersPanel'
import { SimulateButton } from '../../components/SimulateButton'
import { api } from '../../services/api'

export default function OwnerDashboard() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [assignOrder, setAssignOrder] = useState<Order | null>(null)

  const fetchData = async () => {
    try {
      const [fetchedDrivers, fetchedOrders] = await Promise.all([
        api.getDrivers(),
        api.getOrders()
      ])
      
      const mappedDrivers = fetchedDrivers.map((d: any) => ({
        ...d,
        lat: d.lat || 0,
        lng: d.lng || 0,
      }))
      
      setDrivers(mappedDrivers)
      setOrders(fetchedOrders)
    } catch (err) {
      console.error('Failed to fetch dashboard data', err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const activeDrivers = useMemo(
    () => drivers.filter((d) => d.status === 'available').length,
    [drivers],
  )
  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === 'pending').length,
    [orders],
  )
  const completedToday = orders.filter(o => o.status === 'delivered' || o.status === 'completed').length

  const handleOrderClick = (order: Order) => {
    if (order.status === 'pending') {
      setAssignOrder(order)
    }
  }

  return (
    <div className="box-border flex h-screen min-h-0 w-full max-w-none flex-col overflow-hidden bg-[#0f0f1a] pt-[60px] text-white">
      <Navbar />
      
      <div className="absolute right-6 top-20 z-10">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-xl bg-[#6c63ff] px-5 py-2.5 font-bold text-white shadow-lg transition hover:bg-[#5b54ff] hover:shadow-[0_0_20px_rgba(108,99,255,0.4)]"
        >
          + Create Order
        </button>
      </div>

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
            <OrdersPanel orders={orders} onOrderClick={handleOrderClick} />
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

      {isCreateModalOpen && (
        <CreateOrderModal 
          onClose={() => setIsCreateModalOpen(false)} 
          onSuccess={() => {
            setIsCreateModalOpen(false)
            fetchData()
          }} 
        />
      )}

      {assignOrder && (
        <AssignDriverModal
          order={assignOrder}
          drivers={drivers}
          onClose={() => setAssignOrder(null)}
          onSuccess={() => {
            setAssignOrder(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}
