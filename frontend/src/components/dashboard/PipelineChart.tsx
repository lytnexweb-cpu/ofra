import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface PipelineData {
  active: number
  offer: number
  conditional: number
  firm: number
  closing: number
}

interface PipelineChartProps {
  data: PipelineData
}

const STATUS_CONFIG = [
  { key: 'active', label: 'Active', color: '#6366F1' },
  { key: 'offer', label: 'Offer', color: '#8B5CF6' },
  { key: 'conditional', label: 'Conditional', color: '#D946EF' },
  { key: 'firm', label: 'Firm', color: '#EC4899' },
  { key: 'closing', label: 'Closing', color: '#F43F5E' },
]

const DEFAULT_PIPELINE: PipelineData = {
  active: 0,
  offer: 0,
  conditional: 0,
  firm: 0,
  closing: 0,
}

export default function PipelineChart({ data }: PipelineChartProps) {
  const isDark = false

  const safeData = data ?? DEFAULT_PIPELINE
  const chartData = STATUS_CONFIG.map((status) => ({
    name: status.label,
    value: safeData[status.key as keyof PipelineData] ?? 0,
    color: status.color,
  }))

  const total = Object.values(safeData).reduce((sum, val) => sum + (val ?? 0), 0)

  // Theme-aware colors
  const axisTickColor = isDark ? '#9CA3AF' : '#6B7280'
  const tooltipBg = isDark ? '#1F2937' : '#fff'
  const tooltipBorder = isDark ? '#374151' : '#E5E7EB'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pipeline</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} active transactions</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>No active transactions</p>
          </div>
        </div>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: axisTickColor }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: isDark ? '#F3F4F6' : '#111827',
                  }}
                  formatter={(value) => [`${value} transaction${value !== 1 ? 's' : ''}`, 'Count']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
