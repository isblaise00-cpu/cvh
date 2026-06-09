/**
 * POST /api/analysis/context
 * Analyse CV vs Situation économique / Projet / Département / Produit
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { extractText, validateFile } from '@/lib/file-parser'
import { analyzeContextMatch } from '@/lib/ai'
import { encrypt } from '@/lib/encryption'
import prisma from '@/lib/db'
import { checkAnalysisLimit } from '@/lib/subscription'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })
    }
    const userId = (session.user as { id: string }).id

    const limitCheck = await checkAnalysisLimit(userId)
    if (!limitCheck.allowed) {
      return NextResponse.json({ success: false, error: limitCheck.reason }, { status: 403 })
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Clé API OpenRouter manquante. Ajoutez OPENROUTER_API_KEY dans .env.local',
      }, { status: 503 })
    }

    const formData = await req.formData()
    const cvFile = formData.get('cv') as File | null
    const contextTitle = (formData.get('contextTitle') as string | null)?.trim() ?? ''
    const contextDesc = (formData.get('contextDesc') as string | null)?.trim() ?? ''
    const contextFile = formData.get('contextFile') as File | null

    if (!cvFile) {
      return NextResponse.json({ success: false, error: 'CV requis.' }, { status: 400 })
    }
    if (!contextTitle) {
      return NextResponse.json({ success: false, error: 'Titre du contexte requis.' }, { status: 400 })
    }
    if (!contextDesc && !contextFile) {
      return NextResponse.json({ success: false, error: 'Description du contexte ou fichier requis.' }, { status: 400 })
    }

    // Validation CV
    const cvCheck = validateFile(cvFile.name, cvFile.size)
    if (!cvCheck.valid) {
      return NextResponse.json({ success: false, error: cvCheck.error }, { status: 400 })
    }

    // Extraction texte CV
    let cvText: string
    try {
      const cvBuffer = Buffer.from(await cvFile.arrayBuffer())
      cvText = await extractText(cvBuffer, cvFile.name)
    } catch (err) {
      return NextResponse.json({
        success: false,
        error: `Impossible de lire le CV : ${err instanceof Error ? err.message : 'Erreur inconnue'}`,
      }, { status: 400 })
    }

    if (!cvText || cvText.length < 50) {
      return NextResponse.json({
        success: false,
        error: 'Le CV semble vide ou illisible.',
      }, { status: 400 })
    }

    // Extraction texte contexte (fichier optionnel)
    let fullContextDesc = contextDesc
    if (contextFile) {
      const fileCheck = validateFile(contextFile.name, contextFile.size)
      if (fileCheck.valid) {
        try {
          const ctxBuffer = Buffer.from(await contextFile.arrayBuffer())
          const fileText = await extractText(ctxBuffer, contextFile.name)
          fullContextDesc = contextDesc
            ? `${contextDesc}\n\n---\n${fileText}`
            : fileText
        } catch {
          // On continue avec le texte seul si le fichier échoue
        }
      }
    }

    // Création de l'analyse en état PROCESSING
    const analysis = await prisma.analysis.create({
      data: {
        userId,
        cvFileName: cvFile.name,
        jobFileName: contextTitle,
        cvContentEnc: encrypt(cvText.slice(0, 5000)),
        jobContentEnc: encrypt(fullContextDesc.slice(0, 3000)),
        analysisType: 'CV_CONTEXT',
        contextTitle,
        contextDesc: fullContextDesc.slice(0, 3000),
        status: 'PROCESSING',
      },
    })

    // Analyse IA asynchrone
    analyzeContextMatch(cvText, contextTitle, fullContextDesc)
      .then(async (result) => {
        const plan = await prisma.actionPlan.create({
          data: {
            userId,
            title: `Plan vers 100% — ${contextTitle} — ${new Date().toLocaleDateString('fr-FR')}`,
            content: result.actionPlan.map((s) => `• ${s.title}: ${s.description}`).join('\n'),
            steps: JSON.parse(JSON.stringify(result.actionPlan)),
            status: 'DRAFT',
          },
        })

        await prisma.analysis.update({
          where: { id: analysis.id },
          data: {
            strengths: result.strengths,
            weaknesses: result.gaps.map((g) => `${g.competence} — gap: ${g.gap}% — ${g.action}`),
            opportunities: result.opportunities,
            threats: result.risks,
            matchScore: result.currentScore,
            summary: result.summary,
            actionPlanId: plan.id,
            status: 'COMPLETED',
          },
        })
        console.log(`[contexte] Terminée — ID: ${analysis.id} — Score actuel: ${result.currentScore}%`)
      })
      .catch(async (err) => {
        const errMsg = err instanceof Error ? err.message : 'Erreur IA inconnue'
        console.error('[contexte] Échec IA:', errMsg)
        await prisma.analysis.update({
          where: { id: analysis.id },
          data: { status: 'FAILED', summary: errMsg },
        })
      })

    return NextResponse.json(
      { success: true, data: { analysisId: analysis.id, status: 'PROCESSING' } },
      { status: 202 }
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur interne'
    console.error('[context-upload]', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
