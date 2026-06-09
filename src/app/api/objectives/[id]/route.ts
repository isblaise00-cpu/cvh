import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

const UpdateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED']).optional(),
  progress: z.number().min(0).max(100).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dueDate: z.string().optional(),
})

// PATCH — Mise à jour partielle
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const obj = await prisma.objective.findFirst({ where: { id, userId } })
  if (!obj) return NextResponse.json({ success: false, error: 'Objectif introuvable.' }, { status: 404 })

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 })
  }

  const { dueDate, ...rest } = parsed.data
  const updated = await prisma.objective.update({
    where: { id },
    data: { ...rest, dueDate: dueDate ? new Date(dueDate) : undefined },
    include: { milestones: true },
  })

  return NextResponse.json({ success: true, data: updated })
}

// DELETE — Suppression
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const obj = await prisma.objective.findFirst({ where: { id, userId } })
  if (!obj) return NextResponse.json({ success: false, error: 'Objectif introuvable.' }, { status: 404 })

  await prisma.objective.delete({ where: { id } })
  return NextResponse.json({ success: true, data: null })
}
