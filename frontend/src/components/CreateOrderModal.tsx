import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { api } from '../services/api'

interface CreateOrderModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function CreateOrderModal({ onClose, onSuccess }: CreateOrderModalProps) {
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.getRestaurants(), api.getCustomers()])
      .then(([rests, custs]) => {
        setRestaurants(rests)
        setCustomers(custs)
      })
      .catch((err) => setError(err.message))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRestaurant || !selectedCustomer) {
      setError('Please select both a restaurant and a customer.')
      return
    }

    const restaurant = restaurants.find(r => r.id.toString() === selectedRestaurant)
    if (!restaurant) return

    setIsSubmitting(true)
    setError('')

    try {
      // Simulate delivery coordinates based on restaurant coordinates
      const delivery_lat = restaurant.lat + (Math.random() - 0.5) * 0.05
      const delivery_lng = restaurant.lng + (Math.random() - 0.5) * 0.05

      await api.createOrder({
        customer_id: parseInt(selectedCustomer),
        restaurant_id: parseInt(selectedRestaurant),
        pickup_lat: restaurant.lat,
        pickup_lng: restaurant.lng,
        delivery_lat,
        delivery_lng
      })
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to create order')
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
        <h2 className="text-xl font-bold text-white mb-4">Create New Order</h2>
        
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">
              Restaurant
            </label>
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#16213e] p-3 text-white focus:border-[#6c63ff] focus:outline-none focus:ring-1 focus:ring-[#6c63ff]"
            >
              <option value="">Select Restaurant</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/70">
              Customer
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#16213e] p-3 text-white focus:border-[#6c63ff] focus:outline-none focus:ring-1 focus:ring-[#6c63ff]"
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#6c63ff] px-6 py-2 font-bold text-white transition hover:bg-[#5b54ff] disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
