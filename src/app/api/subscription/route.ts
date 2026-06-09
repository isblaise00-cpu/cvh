import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { getUserSubscription } from '@/lib/subscription'
import { z } from 'zod'

const ConfirmSchema = z.object({
  plan:      z.enum(['PRO', 'TEAM']),
  months:    z.number().int().min(1).max(24),
  reference: z.string(),
})

// GET — Retourne l'abonnement courant de l'utilisateur
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })
  }
  const userId = (session.user as { id: string }).id

  const subscription = await getUserSubscription(userId)
  return NextResponse.json({ success: true, data: subscription })
}

// POST — Confirme le paiement et active / prolonge l'abonnement
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })
  }
  const userId = (session.user as { id: string }).id

  const body = await req.json()
  const parsed = ConfirmSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.errors[0]?.message },
      { status: 400 }
    )
  }

  const { plan, months, reference } = parsed.data
  const now = new Date()

  // Si abonnement ACTIVE non expiré → prolonger depuis periodEnd, sinon depuis maintenant
  const existing = await prisma.subscription.findUnique({ where: { userId } })
  const baseDate =
    existing?.status === 'ACTIVE' && existing.periodEnd > now
      ? existing.periodEnd
      : now

  const periodEnd = new Date(baseDate)
  periodEnd.setMonth(periodEnd.getMonth() + months)

  const subscription = await prisma.subscription.upsert({
    where: { userId },
    update: {
      plan,
      status:       'ACTIVE',
      monthsPaid:   (existing?.monthsPaid ?? 0) + months,
      periodStart:  existing?.periodStart ?? now,
      periodEnd,
      yengaReference: reference,
    },
    create: {
      userId,
      plan,
      status:      'ACTIVE',
      monthsPaid:  months,
      periodStart: now,
      periodEnd,
      yengaReference: reference,
    },
  })

  return NextResponse.json({ success: true, data: subscription }, { status: 201 })
}
