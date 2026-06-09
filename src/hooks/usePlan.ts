'use client'

import { useSession } from 'next-auth/react'
import { PLAN_LIMITS, type PlanKey } from '@/lib/plans'

export function usePlan() {
  const { data: session } = useSession()
  const plan = (((session?.user as { plan?: string })?.plan) ?? 'FREE') as PlanKey
  const limits = PLAN_LIMITS[plan]

  return {
    plan,
    limits,
    isPro:  plan === 'PRO'  || plan === 'TEAM',
    isTeam: plan === 'TEAM',
    isFree: plan === 'FREE',
  }
}
