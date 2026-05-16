import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface SimulationChartsProps {
  statsHistory: any[]
  currentStats: any
}

const COLORS = ['#00d4aa', '#6c63ff', '#fbbf24', '#ff6b6b']

export function SimulationCharts({ statsHistory, currentStats }: SimulationChartsProps) {
  // Process data for Bar Chart (Orders by status)
  const barData = Object.entries(currentStats?.orders_by_status || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count: value,
  }))

  // Process data for Pie Chart (Driver utilization)
  const pieData = [
    { name: 'Available', value: currentStats?.available_drivers || 0 },
    { name: 'Busy', value: currentStats?.busy_drivers || 0 },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Line Chart: Orders Per Minute */}
      <div className="rounded-2xl border border-white/5 bg-[#1a1a2e] p-4">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-[#6c63ff]">
          Orders Per Minute
        </h3>
        <div className="h-48 w-full" style={{ height: 192 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={statsHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis 
                dataKey="time" 
                hide 
              />
              <YAxis stroke="#ffffff40" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff10' }}
                itemStyle={{ color: '#6c63ff' }}
              />
              <Line 
                type="monotone" 
                dataKey="orders_per_minute" 
                stroke="#6c63ff" 
                strokeWidth={2} 
                dot={false} 
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart: Orders By Status */}
      <div className="rounded-2xl border border-white/5 bg-[#1a1a2e] p-4">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-[#00d4aa]">
          Orders By Status
        </h3>
        <div className="h-48 w-full" style={{ height: 192 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} />
              <YAxis stroke="#ffffff40" fontSize={10} />
              <Tooltip 
                cursor={{ fill: '#ffffff05' }}
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff10' }}
              />
              <Bar dataKey="count" fill="#00d4aa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart: Driver Utilization */}
      <div className="rounded-2xl border border-white/5 bg-[#1a1a2e] p-4">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-[#fbbf24]">
          Driver Utilization
        </h3>
        <div className="h-48 w-full" style={{ height: 192 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff10' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Area Chart: Cumulative Orders */}
      <div className="rounded-2xl border border-white/5 bg-[#1a1a2e] p-4">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-[#ff6b6b]">
          Cumulative Orders
        </h3>
        <div className="h-48 w-full" style={{ height: 192 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={statsHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="time" hide />
              <YAxis stroke="#ffffff40" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff10' }} />
              <Area 
                type="monotone" 
                dataKey="total_orders_processed" 
                stroke="#ff6b6b" 
                fill="#ff6b6b33" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
