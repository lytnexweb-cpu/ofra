import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface PipelineData {
  consultation: number
  offer: number
  accepted: number
  conditions: number
  notary: number
  closing: number
}

interface PipelineChartProps {
  data: PipelineData
}

const STATUS_CONFIG = [
  { key: 'consultation', label: 'Consultation', color: '#6366F1' },
  { key: 'offer', label: 'Offer', color: '#8B5CF6' },
  { key: 'accepted', label: 'Accepted', color: '#A855F7' },
  { key: 'conditions', label: 'Conditions', color: '#D946EF' },
  { key: 'notary', label: 'Notary', color: '#EC4899' },
  { key: 'closing', label: 'Closing', color: '#F43F5E' },
]

export default function PipelineChart({ data }: PipelineChartProps) {
  const chartData = STATUS_CONFIG.map((status) => ({
    name: status.label,
    value: data[status.key as keyof PipelineData],
    color: status.color,
  }))

  const total = Object.values(data).reduce((sum, val) => sum + val, 0)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pipeline</h3>
          <p className="text-sm text-gray-500">{total} active transactions</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
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
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
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
                <span className="text-xs text-gray-600">
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
