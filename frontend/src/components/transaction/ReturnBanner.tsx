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
      className="mb-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3"
      role="status"
      data-testid="return-banner"
    >
      <Info className="w-5 h-5 text-primary shrink-0" />
      <p className="flex-1 text-sm text-foreground">
        {t('returnBanner.message')}
      </p>
      <button
        onClick={dismiss}
        className="p-1 rounded-sm text-muted-foreground hover:text-foreground"
        aria-label={t('returnBanner.dismiss')}
        data-testid="return-banner-dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
