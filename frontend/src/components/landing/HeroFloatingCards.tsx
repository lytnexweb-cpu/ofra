/**
 * Three floating decorative cards for the landing hero section.
 * Pure presentational — hardcoded FR mockup data, CSS-only animations.
 */
export function HeroFloatingCards() {
  return (
    <div className="relative h-[480px] lg:h-[520px] w-full">
      {/* Card 1 — Closing Date (top-left, front) */}
      <div className="hero-float-1 absolute top-8 left-0 z-30 w-[280px] bg-white rounded-2xl shadow-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-stone-500">Fermeture prévue</p>
            <p className="text-lg font-bold text-[#1E3A5F]">15 mars 2026</p>
          </div>
        </div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-stone-500">Progression</p>
          <p className="text-sm font-semibold text-amber-600">dans 32 jours</p>
        </div>
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#1E3A5F] rounded-full" style={{ width: '50%' }} />
        </div>
        <p className="text-[10px] text-stone-400 mt-1.5 text-right">Étape 4 / 8</p>
      </div>

      {/* Card 2 — Step Progress (top-right) */}
      <div className="hero-float-2 absolute top-24 right-0 z-20 w-[220px] bg-white rounded-2xl shadow-xl p-5">
        <p className="text-xs font-semibold text-stone-700 mb-3">Étapes</p>
        <div className="flex items-center justify-between mb-3">
          {/* 8 step circles: 3 done, 1 active, 4 pending */}
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
          <p className="text-[10px] text-stone-500">Étape actuelle</p>
          <p className="text-xs font-semibold text-[#1E3A5F]">Période conditionnelle</p>
        </div>
      </div>

      {/* Card 3 — Offer Accepted (bottom-right, pill) */}
      <div className="hero-float-3 absolute bottom-16 right-8 z-10 bg-white rounded-2xl shadow-xl px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-emerald-700">Offre acceptée</p>
          <p className="text-lg font-bold text-stone-900">285 000 $</p>
        </div>
      </div>
    </div>
  )
}
