import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { notificationsApi, type NotificationItem } from '../api/notifications.api'
import { formatDistanceToNow } from '../lib/date'
import { BellIcon } from './ui/Icons'
import { X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './ui/DropdownMenu'

const POLL_INTERVAL = 60_000 // 60s

/** Play a short notification "ding" using Web Audio API */
function playNotificationSound() {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.frequency.setValueAtTime(880, ctx.currentTime) // A5
    oscillator.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.3)
  } catch {
    // Audio not available (e.g. no user interaction yet) — silent fail
  }
}

export default function NotificationBell() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const prevCountRef = useRef<number | null>(null)

  // Poll unread count
  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: POLL_INTERVAL,
  })

  const unreadCount = countData?.data?.count ?? 0

  // Play sound when unread count increases
  const playSound = useCallback(() => playNotificationSound(), [])
  useEffect(() => {
    if (prevCountRef.current !== null && unreadCount > prevCountRef.current) {
      playSound()
    }
    prevCountRef.current = unreadCount
  }, [unreadCount, playSound])

  // Fetch list when dropdown opens, refresh every 30s while open
  const { data: listData } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationsApi.list(1, 20),
    enabled: open,
    refetchInterval: open ? 30_000 : false,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const deleteAllMutation = useMutation({
    mutationFn: notificationsApi.deleteAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const notifications = listData?.data?.notifications ?? []

  function handleNotificationClick(n: NotificationItem) {
    if (!n.readAt) {
      markReadMutation.mutate(n.id)
    }
    if (n.link) {
      setOpen(false)
      navigate(n.link)
    }
  }

  function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation()
    deleteMutation.mutate(id)
  }

  function badgeText(): string | null {
    if (unreadCount <= 0) return null
    if (unreadCount > 9) return '9+'
    return String(unreadCount)
  }

  const badge = badgeText()

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
          aria-label={t('common.notifications')}
        >
          <BellIcon className="w-5 h-5" />
          {badge && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
              {badge}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            {t('common.notifications')}
          </DropdownMenuLabel>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  markAllReadMutation.mutate()
                }}
                className="text-xs text-primary hover:underline"
                aria-label={t('notificationBell.markAllRead')}
              >
                {t('notificationBell.markAllRead')}
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  deleteAllMutation.mutate()
                }}
                className="text-xs text-stone-400 hover:text-red-500 hover:underline"
                aria-label={t('notificationBell.clearAll')}
              >
                {t('notificationBell.clearAll')}
              </button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator className="m-0" />

        {/* List */}
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-stone-400">
            {t('notificationBell.empty')}
          </div>
        ) : (
          <div>
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                data-severity={n.severity}
                className={`group w-full text-left px-3 py-2.5 border-b border-stone-100 last:border-b-0 hover:bg-stone-50 transition-colors ${
                  !n.readAt ? 'bg-blue-50/50' : ''
                } ${n.severity === 'urgent' ? 'bg-red-50' : ''}`}
              >
                <div className="flex gap-2">
                  <span className="text-base shrink-0 mt-0.5">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.readAt ? 'font-medium' : 'text-stone-600'}`}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-stone-500 mt-0.5 truncate">{n.body}</p>
                    )}
                    {n.emailRecipients && n.emailRecipients.length > 0 && (
                      <p className="text-xs text-stone-400 mt-0.5">
                        {t('notificationBell.emailSentTo')}{' '}
                        {n.emailRecipients.join(', ')}
                      </p>
                    )}
                    <p className="text-[11px] text-stone-400 mt-1">
                      {formatDistanceToNow(n.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-start gap-1 shrink-0 mt-0.5">
                    {!n.readAt && (
                      <span className="w-2 h-2 rounded-full bg-primary mt-1" />
                    )}
                    <button
                      onClick={(e) => handleDelete(e, n.id)}
                      className="p-0.5 rounded text-stone-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                      aria-label={t('notificationBell.delete')}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
