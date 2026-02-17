// OFRA Logo - Option C with golden accent
// Blue house body, golden roof, white circle window
import { useTranslation } from 'react-i18next'

interface OfraLogoProps {
  size?: number
  className?: string
  variant?: 'default' | 'white'
}

export function OfraLogo({ size = 42, className, variant = 'default' }: OfraLogoProps) {
  const isWhite = variant === 'white'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-label="OFRA logo"
    >
      {/* House body */}
      <path d="M24 8L8 22V40H40V22L24 8Z" fill={isWhite ? '#FFFFFF' : '#1E3A5F'}/>
      {/* Golden roof accent */}
      <path d="M24 4L2 22L8 22L24 8L40 22L46 22L24 4Z" fill="#D97706"/>
      {/* Circle window / O symbol */}
      <circle cx="24" cy="28" r="6" fill={isWhite ? '#1E3A5F' : '#FAFAF9'}/>
    </svg>
  )
}

// Full logo with text
interface OfraLogoFullProps {
  iconSize?: number
  className?: string
  showTagline?: boolean
  invertColors?: boolean
}

export function OfraLogoFull({ iconSize = 42, className, showTagline = true, invertColors = false }: OfraLogoFullProps) {
  const { t } = useTranslation()

  return (
    <div className={className}>
      <div className="flex items-center justify-center gap-3 mb-2">
        <OfraLogo size={iconSize} variant={invertColors ? 'white' : 'default'} />
        <span
          className={`text-3xl font-extrabold tracking-tight font-outfit ${
            invertColors ? 'text-white' : 'text-primary dark:text-white'
          }`}
        >
          OFRA
        </span>
      </div>
      {showTagline && (
        <p className={`text-sm font-medium text-center ${invertColors ? 'text-white/70' : 'text-stone-500 dark:text-stone-400'}`}>
          {t('app.tagline')}
        </p>
      )}
    </div>
  )
}

export default OfraLogo
