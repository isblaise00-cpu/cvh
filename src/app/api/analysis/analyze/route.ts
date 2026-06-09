import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

// GET /api/analysis/analyze?id=xxx — Vérifie le statut / retourne les résultats
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })
    }
    const userId = (session.user as { id: string }).id

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      // Retourne toutes les analyses de l'utilisateur
      const analyses = await prisma.analysis.findMany({
        where: { userId },
        include: { actionPlan: true },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ success: true, data: analyses })
    }

    const analysis = await prisma.analysis.findFirst({
      where: { id, userId },
      include: { actionPlan: true },
    })

    if (!analysis) {
      return NextResponse.json({ success: false, error: 'Analyse introuvable.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: analysis })
  } catch (error) {
    console.error('[analyze-get]', error)
    return NextResponse.json({ success: false, error: 'Erreur interne.' }, { status: 500 })
  }
}
