import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, UserPlus, Crown, Mail, Shield, Eye, Pencil, X } from 'lucide-react'
import {
  membersApi,
  type TransactionMember,
  type MemberRole,
  type InviteMemberRequest,
} from '../../api/members.api'
import { toast } from '../../hooks/use-toast'
import { Button } from '../ui/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/Dialog'

interface MembersPanelProps {
  isOpen: boolean
  onClose: () => void
  transactionId: number
  ownerUserId: number
}

const ROLES: MemberRole[] = ['viewer', 'editor', 'admin']

const roleIcons: Record<MemberRole, typeof Eye> = {
  viewer: Eye,
  editor: Pencil,
  admin: Shield,
}

const roleColors: Record<MemberRole, string> = {
  viewer: 'text-stone-600 bg-stone-100',
  editor: 'text-blue-600 bg-blue-50',
  admin: 'text-amber-600 bg-amber-50',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  revoked: 'bg-red-100 text-red-700',
}

export default function MembersPanel({ isOpen, onClose, transactionId, ownerUserId }: MembersPanelProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [inviteForm, setInviteForm] = useState<InviteMemberRequest>({
    email: '',
    role: 'viewer',
    message: '',
  })
  const [showInviteForm, setShowInviteForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['members', transactionId],
    queryFn: () => membersApi.list(transactionId),
    enabled: isOpen,
  })

  const members = data?.data?.members ?? []

  const inviteMutation = useMutation({
    mutationFn: (data: InviteMemberRequest) => membersApi.invite(transactionId, data),
    onSuccess: (response) => {
      if (response.success) {
        toast({ title: t('common.success'), description: t('members.inviteSuccess'), variant: 'success' })
        queryClient.invalidateQueries({ queryKey: ['members', transactionId] })
        setInviteForm({ email: '', role: 'viewer', message: '' })
        setShowInviteForm(false)
      }
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: number; role: MemberRole }) =>
      membersApi.updateRole(transactionId, memberId, role),
    onSuccess: () => {
      toast({ title: t('members.roleUpdated'), variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['members', transactionId] })
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (memberId: number) => membersApi.revoke(transactionId, memberId),
    onSuccess: () => {
      toast({ title: t('members.revoked'), variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['members', transactionId] })
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteForm.email.trim()) return
    inviteMutation.mutate({
      ...inviteForm,
      message: inviteForm.message?.trim() || undefined,
    })
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('members.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Owner */}
          <div>
            <h4 className="text-xs font-medium uppercase text-muted-foreground tracking-wider mb-2">
              {t('members.owner')}
            </h4>
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Crown className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{t('members.ownerLabel')}</p>
                <p className="text-xs text-muted-foreground">ID: {ownerUserId}</p>
              </div>
            </div>
          </div>

          {/* Members list */}
          <div>
            <h4 className="text-xs font-medium uppercase text-muted-foreground tracking-wider mb-2">
              {t('members.membersList')} ({members.length})
            </h4>

            {isLoading && (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            )}

            {!isLoading && members.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('members.empty')}
              </p>
            )}

            <div className="space-y-2">
              {members.map((member: TransactionMember) => {
                const RoleIcon = roleIcons[member.role]
                return (
                  <div key={member.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${roleColors[member.role]}`}>
                      <RoleIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {member.user?.fullName || member.email}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusColors[member.status]}`}>
                          {t(`members.status.${member.status}`)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t(`members.roles.${member.role}`)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {member.status !== 'revoked' && (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) =>
                              updateRoleMutation.mutate({ memberId: member.id, role: e.target.value as MemberRole })
                            }
                            className="text-xs border rounded px-1.5 py-1 bg-background"
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {t(`members.roles.${role}`)}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => revokeMutation.mutate(member.id)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500"
                            title={t('members.revoke')}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Invite form */}
          {!showInviteForm ? (
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInviteForm(true)}
                className="w-full gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {t('members.invite')}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleInviteSubmit} className="space-y-3 border-t pt-4">
              <h4 className="text-sm font-semibold">{t('members.inviteTitle')}</h4>
              <div>
                <label className="block text-xs font-medium mb-1">{t('members.emailLabel')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className={`${inputClass} pl-9`}
                    placeholder="courtier@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t('members.roleLabel')}</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as MemberRole })}
                  className={inputClass}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {t(`members.roles.${role}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t('members.messageLabel')}</label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                  className={`${inputClass} min-h-[60px] resize-none`}
                  placeholder={t('members.messagePlaceholder')}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowInviteForm(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" size="sm" disabled={inviteMutation.isPending || !inviteForm.email.trim()}>
                  {inviteMutation.isPending ? t('common.loading') : t('members.sendInvite')}
                </Button>
              </div>
            </form>
          )}
        </div>

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={onClose} className="w-full">
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
