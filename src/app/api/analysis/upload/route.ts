import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { extractText, validateFile } from '@/lib/file-parser'
import { analyzeDocuments } from '@/lib/ai'
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

    // Vérification quota du plan
    const limitCheck = await checkAnalysisLimit(userId)
    if (!limitCheck.allowed) {
      return NextResponse.json({ success: false, error: limitCheck.reason }, { status: 403 })
    }

    // Vérification clé API dès le départ
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Clé API OpenRouter manquante. Ajoutez OPENROUTER_API_KEY dans .env.local',
      }, { status: 503 })
    }

    const formData = await req.formData()
    const cvFile = formData.get('cv') as File | null
    const jobFile = formData.get('job') as File | null

    if (!cvFile || !jobFile) {
      return NextResponse.json(
        { success: false, error: 'CV et fiche de poste requis.' },
        { status: 400 }
      )
    }

    // Validation taille et format
    for (const file of [cvFile, jobFile]) {
      const check = validateFile(file.name, file.size)
      if (!check.valid) {
        return NextResponse.json({ success: false, error: check.error }, { status: 400 })
      }
    }

    // Extraction du texte
    let cvText: string
    let jobText: string
    try {
      const cvBuffer = Buffer.from(await cvFile.arrayBuffer())
      const jobBuffer = Buffer.from(await jobFile.arrayBuffer())
      cvText = await extractText(cvBuffer, cvFile.name)
      jobText = await extractText(jobBuffer, jobFile.name)
    } catch (err) {
      return NextResponse.json({
        success: false,
        error: `Impossible de lire les fichiers : ${err instanceof Error ? err.message : 'Erreur inconnue'}`,
      }, { status: 400 })
    }

    if (!cvText || cvText.length < 50) {
      return NextResponse.json({
        success: false,
        error: 'Le CV semble vide ou illisible. Vérifiez que le PDF contient du texte (pas une image scannée).',
      }, { status: 400 })
    }

    // Création de l'analyse en état PROCESSING
    const analysis = await prisma.analysis.create({
      data: {
        userId,
        cvFileName: cvFile.name,
        jobFileName: jobFile.name,
        cvContentEnc: encrypt(cvText.slice(0, 5000)),
        jobContentEnc: encrypt(jobText.slice(0, 3000)),
        status: 'PROCESSING',
      },
    })

    // Analyse IA asynchrone
    analyzeDocuments(cvText, jobText)
      .then(async (result) => {
        const plan = await prisma.actionPlan.create({
          data: {
            userId,
            title: `Plan d'action — ${new Date().toLocaleDateString('fr-FR')}`,
            content: result.actionPlan.map((s) => `• ${s.title}: ${s.description}`).join('\n'),
            steps: result.actionPlan,
            status: 'DRAFT',
          },
        })

        await prisma.analysis.update({
          where: { id: analysis.id },
          data: {
            strengths: result.strengths,
            weaknesses: result.weaknesses,
            opportunities: result.opportunities,
            threats: result.threats,
            matchScore: result.matchScore,
            summary: result.summary,
            actionPlanId: plan.id,
            status: 'COMPLETED',
          },
        })
        console.log(`[analyse] Terminée — ID: ${analysis.id} — Score: ${result.matchScore}%`)
      })
      .catch(async (err) => {
        const errMsg = err instanceof Error ? err.message : 'Erreur IA inconnue'
        console.error('[analyse] Échec IA:', errMsg)
        await prisma.analysis.update({
          where: { id: analysis.id },
          data: {
            status: 'FAILED',
            summary: errMsg, // stocke le message d'erreur pour debug
          },
        })
      })

    return NextResponse.json(
      { success: true, data: { analysisId: analysis.id, status: 'PROCESSING' } },
      { status: 202 }
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur interne'
    console.error('[upload]', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
