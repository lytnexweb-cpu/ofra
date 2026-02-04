import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../contexts/ThemeContext'

interface PipelineStep {
  slug: string
  name: string
  count: number
}

interface PipelineChartProps {
  data: PipelineStep[]
}

const STEP_COLORS = [
  '#6366F1',
  '#8B5CF6',
  '#D946EF',
  '#EC4899',
  '#F43F5E',
  '#F97316',
  '#EAB308',
  '#22C55E',
]

function getColorForIndex(index: number): string {
  return STEP_COLORS[index % STEP_COLORS.length]
}

export default function PipelineChart({ data }: PipelineChartProps) {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const safeData = data ?? []
  const chartData = safeData.map((step, index) => ({
    name: step.name,
    value: step.count,
    color: getColorForIndex(index),
  }))

  const total = safeData.reduce((sum, step) => sum + step.count, 0)

  // Theme-aware colors
  const axisTickColor = isDark ? '#9CA3AF' : '#6B7280'
  const tooltipBg = isDark ? '#1F2937' : '#fff'
  const tooltipBorder = isDark ? '#374151' : '#E5E7EB'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.charts.pipeline')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {total === 1
              ? t('dashboard.charts.activeTransactionsSingular', { count: total })
              : t('dashboard.charts.activeTransactions', { count: total })}
          </p>
        </div>
      </div>

      {total === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>{t('dashboard.charts.noActiveTransactions')}</p>
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
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: isDark ? '#F3F4F6' : '#111827',
                  }}
                  formatter={(value) => [
                    `${value} ${Number(value) !== 1 ? t('dashboard.charts.transactions') : t('dashboard.charts.transaction')}`,
                    t('dashboard.charts.count'),
                  ]}
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
