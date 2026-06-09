import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const YENGAPAY_API_KEY    = process.env.YENGAPAY_API_KEY!
const YENGAPAY_ORG_ID     = process.env.YENGAPAY_ORG_ID!
const YENGAPAY_PROJECT_ID = process.env.YENGAPAY_PROJECT_ID!

const Schema = z.object({
  amount: z.number().positive(),
  reference: z.string(),
  articles: z.array(z.object({
    name:     z.string(),
    quantity: z.number().int().positive(),
    price:    z.number().nonnegative(),
  })),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Données invalides.' }, { status: 400 })
    }

    const { amount, reference, articles } = parsed.data
    const normalizedArticles = articles.map(a => ({
      title:       a.name,
      description: a.name,
      name:        a.name,
      quantity:    a.quantity,
      price:       a.price,
    }))

    const yengaRes = await fetch(
      `https://api.yengapay.com/api/v1/groups/${YENGAPAY_ORG_ID}/payment-intent/${YENGAPAY_PROJECT_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-api-key': YENGAPAY_API_KEY,
        },
        body: JSON.stringify({ paymentAmount: amount, reference, articles: normalizedArticles }),
      }
    )

    const data = await yengaRes.json()

    if (!yengaRes.ok) {
      console.error('[payment/initiate] YengaPay error:', data)
      return NextResponse.json(
        { success: false, message: data?.message || 'Erreur YengaPay', provider: data },
        { status: yengaRes.status }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur interne'
    console.error('[payment/initiate]', msg)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
