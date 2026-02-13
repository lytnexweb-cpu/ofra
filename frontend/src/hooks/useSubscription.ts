import { useQuery } from '@tanstack/react-query'
import { subscriptionApi } from '../api/subscription.api'

const PLAN_HIERARCHY = ['starter', 'solo', 'pro', 'agence']

export function useSubscription() {
  const { data, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionApi.get(),
    staleTime: 60_000,
  })

  const sub = data?.data

  return {
    plan: sub?.plan ?? null,
    usage: sub?.usage ?? null,
    billing: sub?.billing ?? null,
    isLoaded: !!sub,
    isLoading,
    meetsMinimum: (required: 'solo' | 'pro' | 'agence') => {
      const slug = sub?.plan?.slug
      if (!slug) return false
      return PLAN_HIERARCHY.indexOf(slug) >= PLAN_HIERARCHY.indexOf(required)
    },
    planSlug: sub?.plan?.slug ?? null,
  }
}
