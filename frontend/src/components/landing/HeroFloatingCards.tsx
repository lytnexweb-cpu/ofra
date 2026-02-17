/**
 * Four floating decorative cards for the landing hero section.
 * Pure presentational — mockup data, CSS-only animations.
 * Cards: Closing Date, Step Progress, FINTRAC Compliance, Auto Condition.
 */
import { useTranslation } from 'react-i18next'

export function HeroFloatingCards() {
  const { t } = useTranslation()

  return (
    <div className="relative h-[480px] lg:h-[520px] w-full">
      {/* Card 1 — Closing Date (top-left, front) */}
      <div className="hero-float-1 absolute top-4 left-0 z-30 w-[270px] bg-white rounded-2xl shadow-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-stone-500">{t('landing.mockup.closingDateLabel')}</p>
            <p className="text-lg font-bold text-[#1E3A5F]">{t('landing.mockup.closingDate')}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-stone-500">{t('landing.mockup.progression')}</p>
          <p className="text-sm font-semibold text-amber-600">{t('landing.mockup.inDays', { count: 32 })}</p>
        </div>
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#1E3A5F] rounded-full" style={{ width: '50%' }} />
        </div>
        <p className="text-[10px] text-stone-400 mt-1.5 text-right">{t('landing.mockup.stepOf', { current: 4, total: 8 })}</p>
      </div>

      {/* Card 2 — Step Progress (top-right) */}
      <div className="hero-float-2 absolute top-20 right-0 z-20 w-[220px] bg-white rounded-2xl shadow-xl p-5">
        <p className="text-xs font-semibold text-stone-700 mb-3">{t('landing.mockup.steps')}</p>
        <div className="flex items-center justify-between mb-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
            <div
              key={step}
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                step <= 3
                  ? 'bg-emerald-500 text-white'
                  : step === 4
                    ? 'bg-[#1E3A5F] text-white ring-2 ring-[#1E3A5F]/20'
                    : 'bg-stone-200 text-stone-400'
              }`}
            >
              {step <= 3 ? '\u2713' : step}
            </div>
          ))}
        </div>
        <div className="bg-stone-50 rounded-lg px-3 py-2">
          <p className="text-[10px] text-stone-500">{t('landing.mockup.currentStep')}</p>
          <p className="text-xs font-semibold text-[#1E3A5F]">{t('landing.mockup.conditionalPeriod')}</p>
        </div>
      </div>

      {/* Card 3 — FINTRAC Compliance (bottom-left) */}
      <div className="hero-float-3 absolute bottom-28 left-2 z-15 w-[240px] bg-white rounded-2xl shadow-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-stone-500">{t('landing.mockup.legalCompliance')}</p>
            <p className="text-sm font-bold text-stone-900">FINTRAC</p>
          </div>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-semibold">
            {t('landing.mockup.validated')} &#10003;
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[7px]">&#10003;</span>
            <span className="text-[11px] text-stone-600">{t('landing.mockup.idVerified')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[7px]">&#10003;</span>
            <span className="text-[11px] text-stone-600">{t('landing.mockup.fundsConfirmed')}</span>
          </div>
        </div>
      </div>

      {/* Card 4 — Auto-Generated Condition (bottom-right) */}
      <div className="hero-float-4 absolute bottom-8 right-4 z-10 w-[250px] bg-white rounded-2xl shadow-xl p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-stone-800 truncate">{t('landing.mockup.wellInspection')}</p>
              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[8px] font-bold shrink-0">{t('landing.mockup.autoBadge')}</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-stone-400 mb-2.5">{t('landing.mockup.autoGeneratedWell')}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] text-red-600 font-medium">{t('landing.mockup.blocking')}</span>
          </div>
          <span className="text-[10px] text-stone-400">{t('landing.mockup.dueInDays', { count: 3 })}</span>
        </div>
      </div>
    </div>
  )
}
