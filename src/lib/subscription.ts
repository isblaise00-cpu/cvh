// Logique serveur uniquement — ne pas importer dans des composants client
import prisma from './db'
import { PLAN_LIMITS, type PlanKey } from './plans'

export async function getUserSubscription(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } })
  if (!sub) return null
  // Si expiré, on signale le plan comme FREE
  if (sub.periodEnd < new Date()) {
    return { ...sub, plan: 'FREE' as PlanKey, status: 'EXPIRED' as const }
  }
  return sub
}

export async function getEffectivePlan(userId: string): Promise<PlanKey> {
  const sub = await getUserSubscription(userId)
  if (!sub || sub.status !== 'ACTIVE') return 'FREE'
  return sub.plan as PlanKey
}

export async function checkAnalysisLimit(
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getEffectivePlan(userId)
  const limit = PLAN_LIMITS[plan].analysisPerMonth
  if (limit === -1) return { allowed: true }

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const count = await prisma.analysis.count({
    where: { userId, createdAt: { gte: startOfMonth } },
  })

  if (count >= limit) {
    return {
      allowed: false,
      reason: `Limite atteinte : ${limit} analyse(s)/mois sur le plan ${plan}. Passez au plan Pro pour des analyses illimitées.`,
    }
  }
  return { allowed: true }
}

export async function checkObjectiveLimit(
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getEffectivePlan(userId)
  const limit = PLAN_LIMITS[plan].maxObjectives
  if (limit === -1) return { allowed: true }

  const count = await prisma.objective.count({ where: { userId } })
  if (count >= limit) {
    return {
      allowed: false,
      reason: `Limite atteinte : ${limit} objectifs maximum sur le plan ${plan}. Passez au plan Pro pour des objectifs illimités.`,
    }
  }
  return { allowed: true }
}

export async function checkPlanFeature(
  userId: string,
  feature: keyof typeof PLAN_LIMITS['FREE']
): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getEffectivePlan(userId)
  if (!PLAN_LIMITS[plan][feature]) {
    return {
      allowed: false,
      reason: `Cette fonctionnalité est disponible à partir du plan Pro. Voir /pricing.`,
    }
  }
  return { allowed: true }
}
