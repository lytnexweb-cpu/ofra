import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { useTheme } from '../../contexts/ThemeContext'

interface RevenueData {
  month: string
  total: number
}

interface RevenueChartProps {
  data: RevenueData[]
  totalRevenue: number
  monthRevenue: number
}

function formatCurrency(value: number | undefined | null): string {
  const safeValue = value ?? 0
  if (safeValue >= 1000000) {
    return `$${(safeValue / 1000000).toFixed(1)}M`
  }
  if (safeValue >= 1000) {
    return `$${(safeValue / 1000).toFixed(0)}K`
  }
  return `$${safeValue.toLocaleString()}`
}

export default function RevenueChart({ data = [], totalRevenue = 0, monthRevenue = 0 }: RevenueChartProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  // Theme-aware colors
  const axisTickColor = isDark ? '#9CA3AF' : '#6B7280'
  const gridColor = isDark ? '#374151' : '#E5E7EB'
  const tooltipBg = isDark ? '#1F2937' : '#fff'
  const tooltipBorder = isDark ? '#374151' : '#E5E7EB'

  const hasData = data.length > 0 && data.some((d) => d.total > 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Commissions</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Last 6 months</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(monthRevenue)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">this month</p>
        </div>
      </div>

      {!hasData ? (
        <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No commission data yet</p>
          </div>
        </div>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: 0, right: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: axisTickColor }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: axisTickColor }}
                  tickFormatter={formatCurrency}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: isDark ? '#F3F4F6' : '#111827',
                  }}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Commission']}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total earned</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalRevenue)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
