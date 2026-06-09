import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { hashPassword } from '@/lib/auth'

const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  gdprConsent: z.boolean().refine((v) => v === true, { message: 'Consentement RGPD requis' }),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = RegisterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message ?? 'Données invalides' },
        { status: 400 }
      )
    }

    const { name, email, password, gdprConsent } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Un compte avec cet email existe déjà.' },
        { status: 409 }
      )
    }

    const hashed = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        gdprConsent,
        consentDate: new Date(),
        role: 'EMPLOYEE',
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })

    return NextResponse.json({ success: true, data: user }, { status: 201 })
  } catch (error) {
    console.error('[register]', error)
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}
