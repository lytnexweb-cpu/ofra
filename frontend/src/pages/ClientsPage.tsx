import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { clientsApi } from '../api/clients.api'
import { normalizeSearch } from '../lib/utils'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Plus, Search, X, Users, Mail, Phone, ChevronRight, Upload } from 'lucide-react'
import CreateClientModal from '../components/CreateClientModal'
import ImportClientsModal from '../components/ImportClientsModal'

// Generate a consistent color based on initials
function getAvatarColor(name: string): string {
  const colors = [
    '#1E3A5F', // Ofra primary
    '#D97706', // Ofra accent
    '#059669', // emerald
    '#7C3AED', // violet
    '#DB2777', // pink
    '#0891B2', // cyan
  ]
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

// Skeleton component for loading state
function ClientCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-stone-200" />
        <div className="flex-1">
          <div className="h-5 w-32 bg-stone-200 rounded mb-2" />
          <div className="h-4 w-48 bg-stone-100 rounded" />
        </div>
        <div className="w-5 h-5 bg-stone-100 rounded" />
      </div>
    </div>
  )
}

// Empty state component
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="text-center py-16">
      <div
        className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: 'rgba(30, 58, 95, 0.1)' }}
      >
        <Users className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-stone-900 mb-2">
        {t('client.empty')}
      </h3>
      <p className="text-stone-500 mb-6 max-w-sm mx-auto">
        {t('client.emptyDescription')}
      </p>
      <Button onClick={onCreateClick} className="bg-primary hover:bg-primary/90">
        <Plus className="w-4 h-4" />
        {t('client.emptyCta')}
      </Button>
    </div>
  )
}

export default function ClientsPage() {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.list(),
  })

  const clients = data?.data?.clients || []

  // Filter clients by search query
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return clients
    const normalizedQuery = normalizeSearch(searchQuery)
    return clients.filter((client) => {
      const fullName = `${client.firstName} ${client.lastName}`
      const haystack = normalizeSearch(`${fullName} ${client.email || ''} ${client.phone || ''}`)
      return haystack.includes(normalizedQuery)
    })
  }, [clients, searchQuery])

  const hasActiveFilters = searchQuery !== ''
  const isFilteredEmpty = hasActiveFilters && filtered.length === 0 && clients.length > 0

  return (
    <div data-testid="clients-page">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1
          className="text-2xl font-bold text-stone-900"
          style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
        >
          {t('nav.clients')}
        </h1>
        <div className="hidden sm:flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            data-testid="import-clients-btn"
          >
            <Upload className="w-4 h-4" />
            {t('csvImport.button')}
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary/90"
            data-testid="create-client-btn"
          >
            <Plus className="w-4 h-4" />
            {t('client.new')}
          </Button>
        </div>
      </div>

      {/* Search bar - only show if there are clients */}
      {!isLoading && clients.length > 0 && (
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              type="text"
              placeholder={t('common.search') + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
              data-testid="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-sm text-stone-400 hover:text-stone-600"
                aria-label={t('common.close')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="clients-skeleton">
          <ClientCardSkeleton />
          <ClientCardSkeleton />
          <ClientCardSkeleton />
          <ClientCardSkeleton />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && clients.length === 0 && (
        <EmptyState onCreateClick={() => setIsModalOpen(true)} />
      )}

      {/* Empty filter results */}
      {isFilteredEmpty && (
        <div className="text-center py-12" data-testid="filter-empty">
          <p className="text-sm text-stone-500 mb-2">
            {t('common.noResults')}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
            data-testid="clear-filters-btn"
          >
            {t('common.clearFilters')}
          </Button>
        </div>
      )}

      {/* Client cards grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 stagger-children" data-testid="clients-grid">
          {filtered.map((client) => {
            const initials = getInitials(client.firstName, client.lastName)
            const avatarColor = getAvatarColor(`${client.firstName}${client.lastName}`)

            return (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="group bg-white rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                data-testid={`client-card-${client.id}`}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar with initials */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {initials}
                  </div>

                  {/* Client info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-900 truncate group-hover:text-primary transition-colors">
                        {client.firstName} {client.lastName}
                      </h3>
                      {client.clientType && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${
                          client.clientType === 'buyer' ? 'bg-blue-50 text-blue-700' :
                          client.clientType === 'seller' ? 'bg-amber-50 text-amber-700' :
                          'bg-purple-50 text-purple-700'
                        }`}>
                          {t(`clients.clientType${client.clientType.charAt(0).toUpperCase() + client.clientType.slice(1)}`)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-stone-500">
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{client.email || t('client.noEmail')}</span>
                      </span>
                      {client.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                          {client.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-400 transition-colors flex-shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <CreateClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <ImportClientsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />

      {/* FAB for mobile */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-4 z-20 w-14 h-14 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center sm:hidden bg-primary"
        data-testid="fab-create"
        aria-label={t('client.new')}
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </div>
  )
}
