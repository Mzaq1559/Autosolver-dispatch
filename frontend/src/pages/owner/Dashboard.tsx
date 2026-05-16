import { motion } from 'framer-motion'
import { useEffect, useMemo, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { Clock, Activity, Truck, Zap, Percent } from 'lucide-react'

import { AnalyticsPanel } from '../../components/AnalyticsPanel'
import { AssignDriverModal } from '../../components/AssignDriverModal'
import { CreateOrderModal } from '../../components/CreateOrderModal'
import type { Driver } from '../../components/DriversPanel'
import { DriversPanel } from '../../components/DriversPanel'
import { MapView } from '../../components/MapView'
import { Navbar } from '../../components/Navbar'
import type { Order } from '../../components/OrdersPanel'
import { OrdersPanel } from '../../components/OrdersPanel'
import { api } from '../../services/api'
import { SimulationControls } from '../../components/SimulationControls'
import { SimulationCharts } from '../../components/SimulationCharts'

export default function OwnerDashboard() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [assignOrder, setAssignOrder] = useState<Order | null>(null)
  
  const [simTime, setSimTime] = useState<string>('')
  const [simStats, setSimStats] = useState<any>(null)
  const [statsHistory, setStatsHistory] = useState<any[]>([])
  const [simRunning, setSimRunning] = useState(false)
  const [simPaused, setSimPaused] = useState(false)
  const [simSpeed, setSimSpeed] = useState(12)
  
  const socketRef = useRef<Socket | null>(null)
  const lastStatsUpdate = useRef<number>(0)

  const fetchData = async () => {
    try {
      const [fetchedDrivers, fetchedOrders] = await Promise.all([api.getDrivers(), api.getOrders()])
      setDrivers(fetchedDrivers.map((d: any) => ({ ...d, lat: d.lat || 0, lng: d.lng || 0 })))
      setOrders(fetchedOrders)
    } catch (err) {
      console.error('Failed to fetch dashboard data', err)
    }
  }

  useEffect(() => {
    fetchData()
    const socket = io('http://localhost:8000', { path: '/ws/simulation', transports: ['websocket'] })
    socketRef.current = socket
    socket.on('connect', () => console.log('Connected to simulation WebSocket'))

    socket.on('simulation_state', (data) => {
      setSimTime(data.current_time)
      setActiveOrders(data.active_orders)
      setDrivers(data.all_drivers)
      setSimStats(data.statistics)
      
      const now = Date.now()
      if (now - lastStatsUpdate.current >= 2000) {
        const time = new Date(data.current_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        setStatsHistory(prev => {
          const newHistory = [...prev, { time, orders_per_minute: data.statistics.orders_per_minute, total_orders_processed: data.statistics.total_orders_processed }]
          return newHistory.slice(-20)
        })
        lastStatsUpdate.current = now
      }
    })

    const fetchSimStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/simulation/status')
        const status = await response.json()
        setSimRunning(status.is_running); setSimPaused(status.is_paused); setSimSpeed(status.speed_multiplier); setSimTime(status.current_time)
      } catch (err) { console.error('Failed to fetch simulation status', err) }
    }
    fetchSimStatus()
    return () => { socket.disconnect() }
  }, [])

  const handleTogglePlay = async () => {
    try {
      if (!simRunning) { await api.startSimulation(); setSimRunning(true); setSimPaused(false) }
      else if (simPaused) { await api.resumeSimulation(); setSimPaused(false) }
      else { await api.pauseSimulation(); setSimPaused(true) }
    } catch (err) { console.error('Failed to toggle simulation', err) }
  }

  const handleSpeedChange = async (speed: number) => {
    try { await api.setSimulationSpeed(speed); setSimSpeed(speed) }
    catch (err) { console.error('Failed to change simulation speed', err) }
  }

  const activeDriversCount = useMemo(() => drivers.filter((d) => d.status === 'available').length, [drivers])
  const pendingOrdersCount = useMemo(() => orders.filter((o) => o.status === 'pending').length, [orders])
  const completedToday = simStats?.total_orders_processed || orders.filter(o => o.status === 'delivered' || o.status === 'completed').length

  const handleOrderClick = (order: Order) => { if (order.status === 'pending') setAssignOrder(order) }

  const formattedSimTime = useMemo(() => {
    if (!simTime) return '--:--'
    return new Date(simTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [simTime])

  return (
    <div className="box-border flex h-screen min-h-0 w-full max-w-none flex-col overflow-hidden bg-[#0f0f1a] pt-[60px] text-white">
      <Navbar />
      <div className="z-20 flex h-14 w-full items-center justify-between border-b border-white/5 bg-[#16213e]/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-[#6c63ff]" />
            <span className="font-semibold text-white/60">Time:</span>
            <span className="font-bold tabular-nums">{formattedSimTime}</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-sm">
            <Activity size={16} className="text-[#00d4aa]" />
            <span className="font-semibold text-white/60">Active:</span>
            <span className="font-bold tabular-nums">{simStats?.active_deliveries || 0}</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-sm">
            <Truck size={16} className="text-[#fbbf24]" />
            <span className="font-semibold text-white/60">Drivers:</span>
            <span className="font-bold tabular-nums">{drivers.filter(d => d.status === 'busy').length}/{drivers.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <Zap size={16} className="text-[#ff6b6b]" />
            <span className="font-semibold text-white/60">Avg:</span>
            <span className="font-bold tabular-nums">{simStats?.avg_delivery_time || 0}min</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-sm">
            <Percent size={16} className="text-[#6c63ff]" />
            <span className="font-semibold text-white/60">Rate:</span>
            <span className="font-bold tabular-nums">94%</span>
          </div>
        </div>
      </div>
      <div className="absolute right-6 top-36 z-10">
        <button onClick={() => setIsCreateModalOpen(true)} className="rounded-xl bg-[#6c63ff] px-5 py-2.5 font-bold text-white shadow-lg transition hover:bg-[#5b54ff] hover:shadow-[0_0_20px_rgba(108,99,255,0.4)]">+ Create Order</button>
      </div>
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-row">
        <motion.aside initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease: 'easeOut' }} className="box-border flex h-full min-h-0 w-[420px] shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-white/5 bg-[#1a1a2e]">
          <div className="flex flex-col gap-6 p-4">
            <SimulationControls currentTime={simTime} speed={simSpeed} isRunning={simRunning} isPaused={simPaused} onTogglePlay={handleTogglePlay} onSpeedChange={handleSpeedChange} />
            <SimulationCharts statsHistory={statsHistory} currentStats={simStats} />
            <AnalyticsPanel activeDrivers={activeDriversCount} pendingOrders={pendingOrdersCount} completedToday={completedToday} />
            <DriversPanel drivers={drivers} />
            <OrdersPanel orders={orders} onOrderClick={handleOrderClick} />
          </div>
        </motion.aside>
        <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45, delay: 0.05 }} className="relative h-full min-h-0 min-w-0 flex-1 bg-[#0f0f1a]">
          <MapView drivers={drivers} orders={orders} activeOrders={activeOrders} />
        </motion.main>
      </div>
      {isCreateModalOpen && <CreateOrderModal onClose={() => setIsCreateModalOpen(false)} onSuccess={() => { setIsCreateModalOpen(false); fetchData() }} />}
      {assignOrder && <AssignDriverModal order={assignOrder} drivers={drivers} onClose={() => setAssignOrder(null)} onSuccess={() => { setAssignOrder(null); fetchData() }} />}
    </div>
  )
}
