import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { suggestObjectiveImprovement } from '@/lib/ai'
import prisma from '@/lib/db'
import { checkObjectiveLimit } from '@/lib/subscription'

const CreateSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  category: z.enum(['SKILLS', 'LEADERSHIP', 'PERFORMANCE', 'WELLBEING', 'CAREER', 'COLLABORATION']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  dueDate: z.string().optional(),
  milestones: z.array(z.object({ title: z.string(), dueDate: z.string().optional() })).optional(),
})

// GET — Liste des objectifs
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const objectives = await prisma.objective.findMany({
    where: { userId },
    include: { milestones: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: objectives })
}

// POST — Créer un objectif
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  // Vérification quota du plan
  const limitCheck = await checkObjectiveLimit(userId)
  if (!limitCheck.allowed) {
    return NextResponse.json({ success: false, error: limitCheck.reason }, { status: 403 })
  }

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 })
  }

  const { title, description, category, priority, dueDate, milestones } = parsed.data

  // Suggestion IA en arrière-plan
  let aiSuggestion: string | undefined
  try {
    aiSuggestion = await suggestObjectiveImprovement(title, description ?? '', 0)
  } catch { /* non bloquant */ }

  const objective = await prisma.objective.create({
    data: {
      userId,
      title,
      description,
      category,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      aiSuggestion,
      milestones: milestones
        ? { create: milestones.map((m) => ({ title: m.title, dueDate: m.dueDate ? new Date(m.dueDate) : undefined })) }
        : undefined,
    },
    include: { milestones: true },
  })

  return NextResponse.json({ success: true, data: objective }, { status: 201 })
}
