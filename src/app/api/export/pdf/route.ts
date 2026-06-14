import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { generatePDFBuffer } from '@/lib/pdf-export'
import type { ExportPayload } from '@/types'
import { checkPlanFeature } from '@/lib/subscription'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  // Vérification plan Pro requis
  const planCheck = await checkPlanFeature(userId, 'pdfExport')
  if (!planCheck.allowed) {
    return NextResponse.json({ success: false, error: planCheck.reason }, { status: 403 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, position: true, department: true,
      role: true, image: true, createdAt: true, updatedAt: true,
      phone: true, bio: true, managerId: true, gdprConsent: true, consentDate: true,
    },
  })

  if (!user) return NextResponse.json({ success: false, error: 'Utilisateur introuvable.' }, { status: 404 })

  const analyses = await prisma.analysis.findMany({
    where: { userId },
    include: { actionPlan: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const objectives = await prisma.objective.findMany({
    where: { userId },
    include: { milestones: true },
    orderBy: { createdAt: 'desc' },
  })

  const payload: ExportPayload = {
    user,
    analyses,
    objectives,
    generatedAt: new Date().toISOString(),
  }

  const buffer = await generatePDFBuffer(payload)

  // Journalisation RGPD de l'export
  console.info(`[RGPD-export] user=${userId} at=${new Date().toISOString()}`)

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="bilan-cvh-${new Date().toISOString().split('T')[0]}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
