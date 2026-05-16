import { motion } from 'framer-motion'
import { Play, Pause } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SimulationControlsProps {
  currentTime: string
  speed: number
  isRunning: boolean
  isPaused: boolean
  onTogglePlay: () => void
  onSpeedChange: (speed: number) => void
}

export function SimulationControls({
  currentTime,
  speed,
  isRunning,
  isPaused,
  onTogglePlay,
  onSpeedChange,
}: SimulationControlsProps) {
  const [formattedTime, setFormattedTime] = useState('')

  useEffect(() => {
    if (!currentTime) return
    const date = new Date(currentTime)
    setFormattedTime(
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    )
  }, [currentTime])

  const speeds = [1, 5, 10, 20]

  // Calculate progress for the scrubber (assuming 12 PM to 1 PM)
  const getProgress = () => {
    if (!currentTime) return 0
    const date = new Date(currentTime)
    const start = new Date(date)
    start.setHours(12, 0, 0, 0)
    const end = new Date(date)
    end.setHours(13, 0, 0, 0)
    
    const total = end.getTime() - start.getTime()
    const current = date.getTime() - start.getTime()
    return Math.max(0, Math.min(100, (current / total) * 100))
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#16213e]/50 p-6 backdrop-blur-md shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[#6c63ff]">
            Simulation Status
          </h3>
          <p className="mt-1 text-3xl font-bold text-white tabular-nums">
            {formattedTime || '12:00 PM'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onTogglePlay}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
              isPaused || !isRunning
                ? 'bg-[#6c63ff] text-white hover:bg-[#5b54ff] hover:scale-110'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {isPaused || !isRunning ? (
              <Play size={24} fill="currentColor" />
            ) : (
              <Pause size={24} fill="currentColor" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-medium text-white/45">
          <span>12:00 PM</span>
          <span>1:00 PM</span>
        </div>
        <div className="relative h-2 w-full rounded-full bg-white/5">
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full bg-[#6c63ff]"
            style={{ width: `${getProgress()}%` }}
            layoutId="progress-bar"
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-[#6c63ff] bg-white shadow-lg cursor-pointer"
            style={{ left: `calc(${getProgress()}% - 8px)` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
          Speed
        </span>
        <div className="flex flex-1 gap-1">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                speed === s
                  ? 'bg-[#6c63ff] text-white shadow-[0_0_15px_rgba(108,99,255,0.3)]'
                  : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
