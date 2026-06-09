/**
 * POST /api/analysis/ml
 * Pont entre Next.js et le microservice Python FastAPI (PyTorch + scikit-learn).
 * Envoie le résultat SWOT de Claude au modèle PyTorch pour enrichissement.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

const PYTHON_AI_URL = process.env.PYTHON_AI_URL ?? 'http://localhost:5001'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })
  }
  const userId = (session.user as { id: string }).id

  try {
    const body = await req.json()
    const { analysisId } = body

    // Récupère l'analyse Claude existante
    const analysis = await prisma.analysis.findFirst({
      where: { id: analysisId, userId, status: 'COMPLETED' },
    })

    if (!analysis) {
      return NextResponse.json({ success: false, error: 'Analyse introuvable ou non terminée.' }, { status: 404 })
    }

    // Récupère les objectifs complétés pour enrichir le contexte
    const completedObjectives = await prisma.objective.count({
      where: { userId, status: 'COMPLETED' },
    })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    })

    // Appel au microservice Python
    const pythonResponse = await fetch(`${PYTHON_AI_URL}/predict/swot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        strengths:    analysis.strengths,
        weaknesses:   analysis.weaknesses,
        opportunities: analysis.opportunities,
        threats:      analysis.threats,
        match_score:  analysis.matchScore,
        user_name:    user?.name ?? 'Collaborateur',
        annees_experience: 0,
        nb_objectifs_completes: completedObjectives,
      }),
      signal: AbortSignal.timeout(15000), // timeout 15s
    })

    if (!pythonResponse.ok) {
      const err = await pythonResponse.text()
      throw new Error(`Microservice Python : ${pythonResponse.status} — ${err}`)
    }

    const mlResult = await pythonResponse.json()

    return NextResponse.json({ success: true, data: mlResult })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue'

    // Microservice non disponible → réponse de fallback gracieuse
    if (msg.includes('fetch') || msg.includes('ECONNREFUSED') || msg.includes('timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Microservice IA Python non disponible. Lancez python-ai/main.py.',
        fallback: true,
      }, { status: 503 })
    }

    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

// GET /api/analysis/ml/health — vérifie si le microservice Python est actif
export async function GET() {
  try {
    const res = await fetch(`${PYTHON_AI_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    })
    const data = await res.json()
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({
      success: false,
      error: 'Microservice Python hors ligne',
      url: PYTHON_AI_URL,
    }, { status: 503 })
  }
}
