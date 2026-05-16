import { motion } from 'framer-motion'
import { useState } from 'react'
import { api } from '../services/api'
import type { Order } from './OrdersPanel'
import type { Driver } from './DriversPanel'

interface AssignDriverModalProps {
  order: Order
  drivers: Driver[]
  onClose: () => void
  onSuccess: () => void
}

export function AssignDriverModal({ order, drivers, onClose, onSuccess }: AssignDriverModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const availableDrivers = drivers.filter(d => d.status === 'available')

  const handleAssign = async (driverId: number) => {
    setIsSubmitting(true)
    setError('')
    try {
      await api.assignDriver(order.id, driverId)
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to assign driver')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a2e] p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Assign Driver</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
        </div>
        
        <p className="text-sm text-white/70 mb-4">
          Assigning driver for order #{order.id} ({order.customer_name} at {order.restaurant_name})
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {availableDrivers.length === 0 ? (
            <p className="text-sm text-white/50 text-center py-4">No drivers available right now.</p>
          ) : (
            availableDrivers.map(d => (
              <div 
                key={d.id} 
                className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-[#16213e] hover:border-[#6c63ff]/50 transition"
              >
                <div>
                  <div className="font-bold text-white">{d.name}</div>
                  <div className="text-xs text-white/50">{d.lat.toFixed(4)}, {d.lng.toFixed(4)}</div>
                </div>
                <button
                  disabled={isSubmitting}
                  onClick={() => handleAssign(d.id)}
                  className="rounded-lg bg-[#00d4aa]/20 px-3 py-1.5 text-xs font-bold text-[#00d4aa] hover:bg-[#00d4aa]/30 disabled:opacity-50"
                >
                  {isSubmitting ? '...' : 'Assign'}
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}
