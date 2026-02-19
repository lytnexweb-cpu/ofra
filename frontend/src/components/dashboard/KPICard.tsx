import { useEffect, useState } from 'react'

interface KPICardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: 'primary' | 'accent' | 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'indigo'
  prefix?: string
  suffix?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

const colorClasses = {
  // Brand colors
  primary: {
    bg: 'bg-[#EEF2F7]#1E3A5F]/20',
    text: 'text-[#1E3A5F]#A9BBCF]',
    icon: 'bg-[#D4DDE8]#1E3A5F]/50 text-[#1E3A5F]#A9BBCF]',
  },
  accent: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    icon: 'bg-amber-100 text-amber-600',
  },
  blue: {
    bg: 'bg-[#EEF2F7]#1E3A5F]/20',
    text: 'text-[#1E3A5F]#A9BBCF]',
    icon: 'bg-[#D4DDE8]#1E3A5F]/50 text-[#1E3A5F]#A9BBCF]',
  },
  green: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    icon: 'bg-emerald-100 text-emerald-600',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    icon: 'bg-purple-100 text-purple-600',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    icon: 'bg-red-100 text-red-600',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    icon: 'bg-yellow-100 text-yellow-600',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    icon: 'bg-indigo-100 text-indigo-600',
  },
}

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1000
    const steps = 30
    const stepDuration = duration / steps
    const increment = value / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current = Math.min(Math.round(increment * step), value)
      setDisplayValue(current)

      if (step >= steps) {
        clearInterval(timer)
        setDisplayValue(value)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [value])

  const formattedValue = displayValue.toLocaleString()

  return (
    <span>
      {prefix}{formattedValue}{suffix}
    </span>
  )
}

export default function KPICard({ title, value, icon, color, prefix, suffix, trend }: KPICardProps) {
  const colors = colorClasses[color]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-6">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${colors.icon}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend.isPositive ? (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-stone-500">{title}</h3>
        <p className={`text-3xl font-bold ${colors.text} mt-1`}>
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
        </p>
      </div>
    </div>
  )
}
