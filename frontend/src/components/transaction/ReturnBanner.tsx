import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Info, X } from 'lucide-react'

const STORAGE_KEY = 'ofra-lastSeenAt'
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

export default function ReturnBanner() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const lastSeen = localStorage.getItem(STORAGE_KEY)
    if (lastSeen) {
      const elapsed = Date.now() - parseInt(lastSeen, 10)
      if (elapsed > TWENTY_FOUR_HOURS) {
        setVisible(true)
      }
    }
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
  }, [])

  const dismiss = () => setVisible(false)

  if (!visible) return null

  return (
    <div
      className="mb-4 flex items-center gap-3 rounded-xl border px-4 py-3"
      style={{
        borderColor: 'rgba(30, 58, 95, 0.2)',
        backgroundColor: 'rgba(30, 58, 95, 0.05)',
      }}
      role="status"
      data-testid="return-banner"
    >
      <Info className="w-5 h-5 shrink-0 text-primary" />
      <p className="flex-1 text-sm text-stone-700">
        {t('returnBanner.message')}
      </p>
      <button
        onClick={dismiss}
        className="p-1 rounded-sm text-stone-400 hover:text-stone-600"
        aria-label={t('returnBanner.dismiss')}
        data-testid="return-banner-dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
