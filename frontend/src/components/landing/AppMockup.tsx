/**
 * Static mockup of the OFRA transaction detail page for the landing hero.
 * Pure presentational — no interactivity, just JSX + Tailwind.
 */
import { useTranslation } from 'react-i18next'

export function AppMockup() {
  const { t } = useTranslation()

  return (
    <div className="relative max-w-5xl mx-auto px-4">
      <div className="rounded-t-2xl overflow-hidden border border-stone-200 border-b-0 shadow-[0_25px_80px_rgba(30,58,95,0.25),0_8px_30px_rgba(0,0,0,0.12)]">
        {/* Browser chrome */}
        <div className="bg-stone-800 px-4 py-2.5 flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white/10 rounded-md px-3 py-1 text-[11px] text-stone-400 font-mono">
            app.ofra.ca/transactions/dupont-45-rue-principale
          </div>
        </div>

        {/* App content */}
        <div className="bg-stone-50 p-4 sm:p-6">
          <div className="max-w-3xl mx-auto">
            {/* Back link */}
            <p className="text-xs text-stone-400 mb-3">&larr; {t('landing.mockup.backTransactions')}</p>

            {/* Header */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="text-lg font-bold text-stone-900 font-outfit">Jean Dupont</h2>
                <p className="text-xs text-stone-400">45 rue Principale, Moncton, NB</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-[10px] font-semibold">
                  {t('landing.mockup.residentialPurchase')}
                </span>
                <span className="text-stone-300">&vellip;</span>
              </div>
            </div>

            {/* Info pills */}
            <div className="flex flex-wrap items-center gap-2 mt-2 mb-4">
              <span className="text-sm text-stone-700 font-semibold">285 000 $</span>
              <span className="text-xs text-emerald-600">({t('landing.mockup.offerAccepted')})</span>
              <span className="text-stone-300">|</span>
              <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[10px]">
                506-555-0142
              </span>
              <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[10px]">
                dupont@email.com
              </span>
            </div>

            {/* Closing Date Card */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-stone-500">{t('landing.mockup.closingDateLabel')}</p>
                  <p className="text-base font-bold text-primary">{t('landing.mockup.closingDate')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-amber-600">{t('landing.mockup.inDays', { count: 32 })}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-primary/5 flex items-center gap-3">
                <p className="text-[10px] text-stone-500">{t('landing.mockup.stepOf', { current: 4, total: 8 })}</p>
                <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '50%' }} />
                </div>
                <p className="text-[10px] text-stone-400">{t('landing.mockup.conditionalPeriod')}</p>
              </div>
            </div>

            {/* Property Profile Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                  {t('landing.mockup.propertyProfile')}
                </p>
                <p className="text-[10px] text-stone-400 flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  {t('landing.mockup.locked')}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[10px]">{t('landing.mockup.residential')}</span>
                <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[10px]">{t('landing.mockup.rural')}</span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">{t('landing.mockup.financed')}</span>
                <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[10px]">{t('landing.mockup.artesianWell')}</span>
                <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-[10px]">{t('landing.mockup.septicTank')}</span>
              </div>
            </div>

            {/* Next Actions Cockpit */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-[10px] font-semibold text-amber-800 flex items-center gap-1 mb-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/></svg>
                {t('landing.mockup.nextActions')}
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span className="text-xs text-stone-700 flex-1">{t('landing.mockup.wellWaterTest')}</span>
                  <span className="text-[10px] text-red-600 font-medium">{t('landing.mockup.dueInDays', { count: 3 })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-xs text-stone-700 flex-1">{t('landing.mockup.financingApproval')}</span>
                  <span className="text-[10px] text-amber-600 font-medium">{t('landing.mockup.daysRemaining', { count: 5 })}</span>
                </div>
              </div>
            </div>

            {/* Document Status Bar */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm px-4 py-3 mb-5 flex items-center justify-between">
              <p className="text-xs text-stone-600 font-medium flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                {t('landing.mockup.documents')} <span className="text-stone-400">(6)</span>
              </p>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <strong className="text-emerald-700">3</strong>
                  <span className="text-stone-500 hidden sm:inline">{t('landing.mockup.docValidated')}</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <strong className="text-amber-700">2</strong>
                  <span className="text-stone-500 hidden sm:inline">{t('landing.mockup.docPending')}</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <strong className="text-red-700">1</strong>
                  <span className="text-stone-500 hidden sm:inline">{t('landing.mockup.docMissing')}</span>
                </span>
              </div>
            </div>

            {/* Steps Timeline */}
            <div className="space-y-0">
              {/* Step 1 — Completed */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">&#10003;</div>
                  <div className="w-0.5 flex-1 bg-emerald-200 my-1" />
                </div>
                <div className="pb-4 flex-1">
                  <p className="text-xs font-semibold text-stone-700">{t('landing.mockup.step1')} <span className="text-stone-400 font-normal">&middot; {t('landing.mockup.step1Date')}</span></p>
                </div>
              </div>

              {/* Step 2 — Completed */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">&#10003;</div>
                  <div className="w-0.5 flex-1 bg-emerald-200 my-1" />
                </div>
                <div className="pb-4 flex-1">
                  <p className="text-xs font-semibold text-stone-700">{t('landing.mockup.step2')} <span className="text-stone-400 font-normal">&middot; {t('landing.mockup.step2Date')}</span></p>
                </div>
              </div>

              {/* Step 3 — Completed */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">&#10003;</div>
                  <div className="w-0.5 flex-1 bg-primary/20 my-1" />
                </div>
                <div className="pb-4 flex-1">
                  <p className="text-xs font-semibold text-stone-700">{t('landing.mockup.step3')} <span className="text-stone-400 font-normal">&middot; {t('landing.mockup.step3Date')}</span></p>
                </div>
              </div>

              {/* Step 4 — ACTIVE */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-primary ring-4 ring-primary/20 flex items-center justify-center text-white text-[10px] font-bold">4</div>
                  <div className="w-0.5 flex-1 bg-stone-200 my-1" />
                </div>
                <div className="pb-4 flex-1">
                  <p className="text-sm font-bold text-primary mb-0.5">{t('landing.mockup.step4')}</p>
                  <p className="text-[10px] text-stone-400 mb-3">{t('landing.mockup.step4Since', { days: 17 })}</p>

                  {/* Blocking conditions */}
                  <div className="mb-3">
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      {t('landing.mockup.blockingCount', { count: 2 })}
                    </p>
                    <div className="ml-4 space-y-2">
                      {/* Condition 1 — Completed */}
                      <div className="bg-white rounded-lg border border-stone-200 p-2.5 flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center text-white text-[8px] mt-0.5 shrink-0">&#10003;</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-stone-700">{t('landing.mockup.residentialInspection')}</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">{t('landing.mockup.completedFeb5')} &middot; <span className="text-emerald-600">{t('landing.mockup.proofUploaded')}</span></p>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-medium shrink-0">{t('landing.mockup.validated')} &#10003;</span>
                      </div>
                      {/* Condition 2 — AI generated, pending */}
                      <div className="bg-white rounded-lg border border-red-200 p-2.5 flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded border-2 border-stone-300 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-xs font-medium text-stone-700">{t('landing.mockup.wellWaterTest')}</p>
                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[8px] font-medium">{t('landing.mockup.autoBadge')}</span>
                          </div>
                          <p className="text-[10px] text-stone-400">{t('landing.mockup.autoGeneratedWell')}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[9px] font-medium shrink-0">{t('landing.mockup.nDays', { count: 3 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Required conditions */}
                  <div className="mb-3">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      {t('landing.mockup.requiredCount', { count: 1 })}
                    </p>
                    <div className="ml-4">
                      <div className="bg-white rounded-lg border border-amber-200 p-2.5 flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded border-2 border-stone-300 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-stone-700">{t('landing.mockup.financingApproval')}</p>
                          <p className="text-[10px] text-stone-400">{t('landing.mockup.awaitingLender')}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[9px] font-medium shrink-0">{t('landing.mockup.nDays', { count: 5 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommended */}
                  <div>
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                      {t('landing.mockup.recommendedCount', { count: 1 })}
                    </p>
                    <div className="ml-4">
                      <div className="bg-white rounded-lg border border-stone-200 p-2.5 flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center text-white text-[8px] mt-0.5 shrink-0">&#10003;</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-stone-700">{t('landing.mockup.septicInspection')}</p>
                          <p className="text-[10px] text-stone-400">{t('landing.mockup.completedFeb6')} &middot; <span className="text-emerald-600">{t('landing.mockup.reportReceived')}</span></p>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-medium shrink-0">{t('landing.mockup.validated')} &#10003;</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5 — Future */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-stone-400 text-[10px]">5</div>
                  <div className="flex-1 my-1 border-l-2 border-dashed border-stone-300" />
                </div>
                <div className="pb-4"><p className="text-xs text-stone-400">{t('landing.mockup.step5')}</p></div>
              </div>

              {/* Step 6 */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-stone-400 text-[10px]">6</div>
                  <div className="flex-1 my-1 border-l-2 border-dashed border-stone-300" />
                </div>
                <div className="pb-4"><p className="text-xs text-stone-400">{t('landing.mockup.step6')}</p></div>
              </div>

              {/* Step 7 */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-stone-400 text-[10px]">7</div>
                  <div className="flex-1 my-1 border-l-2 border-dashed border-stone-300" />
                </div>
                <div className="pb-4"><p className="text-xs text-stone-400">{t('landing.mockup.step7')}</p></div>
              </div>

              {/* Step 8 */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-stone-400 text-[10px]">8</div>
                </div>
                <div><p className="text-xs text-stone-400">{t('landing.mockup.step8')}</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fade out bottom */}
      <div className="h-24 bg-gradient-to-b from-transparent to-stone-50 -mt-24 relative z-10 rounded-b-2xl" />
    </div>
  )
}
