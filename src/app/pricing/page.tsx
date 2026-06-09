'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { PaymentModal } from '@/components/payment/PaymentModal'
import { PLAN_PRICES, type PlanKey } from '@/lib/plans'

const PLANS: {
  key: PlanKey
  label: string
  badge?: string
  features: string[]
}[] = [
  {
    key: 'FREE',
    label: 'Gratuit',
    features: [
      '1 analyse IA / mois',
      '2 objectifs maximum',
      'Tableau de bord basique',
      'Accès communauté',
    ],
  },
  {
    key: 'PRO',
    label: 'Pro',
    badge: 'Populaire',
    features: [
      'Analyses IA illimitées',
      'Objectifs illimités',
      'Export PDF',
      'Suggestions IA avancées',
      'Support prioritaire',
    ],
  },
  {
    key: 'TEAM',
    label: 'Team',
    features: [
      'Tout le plan Pro',
      'Organigramme interactif',
      'Accès manager',
      'Multi-utilisateurs',
      'Rapports consolidés',
    ],
  },
]

export default function PricingPage() {
  const { data: session, update } = useSession()
  const router = useRouter()

  const [months, setMonths] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState<'PRO' | 'TEAM' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [pendingRef, setPendingRef] = useState('')

  const handleSelectPlan = async (plan: 'PRO' | 'TEAM') => {
    if (!session?.user) {
      router.push('/auth/login')
      return
    }
    setSelectedPlan(plan)
    setSubmitting(true)

    try {
      const amount = PLAN_PRICES[plan] * months
      const reference = `CVH-${plan}-${Date.now()}`
      setPendingRef(reference)

      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          reference,
          articles: [{ name: `CVH ${plan} — ${months} mois`, quantity: months, price: PLAN_PRICES[plan] }],
        }),
      })

      const data = await res.json()
      if (!data.success || !data.data) {
        alert(data.message || 'Erreur lors de l\'initialisation du paiement')
        setSubmitting(false)
        return
      }

      const d = data.data
      const url =
        d.checkoutPageUrlWithPaymentToken ||
        d.checkout_url ||
        d.url ||
        d.payment_url ||
        d.paymentLink ||
        (d.token ? `https://checkout.yengapay.com/checkout/${d.token}` : null)

      if (!url) {
        alert('Impossible d\'obtenir le lien de paiement YengaPay')
        setSubmitting(false)
        return
      }

      setCheckoutUrl(url)
      setPaymentOpen(true)
    } catch {
      alert('Erreur réseau. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentSuccess = async () => {
    setPaymentOpen(false)
    setCheckoutUrl(null)
    if (!selectedPlan) return

    try {
      await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, months, reference: pendingRef }),
      })
      // Rafraîchit le JWT pour que le plan soit à jour dans la session
      await update()
      router.push('/settings/billing')
    } catch {
      alert('Paiement effectué mais erreur d\'activation. Contactez le support.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-accent-600 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold">C</div>
          <span className="font-bold text-lg">CVH</span>
        </Link>
        {session?.user ? (
          <Link href="/dashboard" className="text-white/70 hover:text-white text-sm transition">
            ← Tableau de bord
          </Link>
        ) : (
          <Link href="/auth/login" className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition">
            Connexion
          </Link>
        )}
      </header>

      {/* Hero */}
      <section className="text-center px-8 py-14 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          Choisissez votre plan
        </h1>
        <p className="text-white/70 text-lg mb-10">
          Débloquez tout le potentiel de CVH. Payez en FCFA, sans engagement.
        </p>

        {/* Sélecteur de durée */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Durée d&apos;abonnement</span>
            <span className="text-xl font-bold">{months} mois</span>
          </div>
          <input
            type="range"
            min={1} max={24} step={1}
            value={months}
            onChange={e => setMonths(Number(e.target.value))}
            className="w-full accent-white cursor-pointer"
          />
          <div className="flex justify-between text-xs text-white/50 mt-2">
            <span>1 mois</span>
            <span>6 mois</span>
            <span>12 mois</span>
            <span>24 mois</span>
          </div>
          {months >= 6 && (
            <div className="mt-3 text-xs text-green-300 font-medium">
              ✓ Merci pour votre fidélité — {months} mois d&apos;accès continu
            </div>
          )}
        </div>
      </section>

      {/* Cards */}
      <section className="px-8 pb-24 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map(plan => {
            const totalPrice = PLAN_PRICES[plan.key] * months
            const isPaid = plan.key !== 'FREE'

            return (
              <div
                key={plan.key}
                className={`relative bg-white rounded-2xl p-6 text-gray-900 flex flex-col
                  ${plan.badge
                    ? 'ring-2 ring-primary-500 shadow-2xl md:scale-105'
                    : 'shadow-lg'
                  }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-primary-600 text-white text-xs font-bold rounded-full shadow">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Prix */}
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-gray-700 mb-1">{plan.label}</h2>
                  <div className="text-3xl font-extrabold text-primary-700">
                    {isPaid ? `${totalPrice.toLocaleString('fr-FR')} FCFA` : 'Gratuit'}
                  </div>
                  {isPaid && months > 1 && (
                    <div className="text-xs text-gray-400 mt-1">
                      {PLAN_PRICES[plan.key].toLocaleString('fr-FR')} FCFA/mois × {months} mois
                    </div>
                  )}
                  {isPaid && months === 1 && (
                    <div className="text-xs text-gray-400 mt-1">par mois</div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 font-bold mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isPaid ? (
                  <button
                    onClick={() => handleSelectPlan(plan.key as 'PRO' | 'TEAM')}
                    disabled={submitting && selectedPlan === plan.key}
                    className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold
                               hover:bg-primary-700 active:scale-95 transition-all
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting && selectedPlan === plan.key
                      ? 'Initialisation…'
                      : `Choisir ${plan.label}`}
                  </button>
                ) : (
                  <div className="w-full py-3 bg-gray-100 text-gray-400 rounded-xl font-medium text-center text-sm cursor-default">
                    Plan actuel (gratuit)
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-center text-white/40 text-xs mt-10">
          Paiement sécurisé via YengaPay · Mobile Money · Visa · Mastercard
        </p>
      </section>

      <PaymentModal
        open={paymentOpen}
        checkoutUrl={checkoutUrl}
        onSuccess={handlePaymentSuccess}
        onClose={() => { setPaymentOpen(false); setCheckoutUrl(null) }}
      />
    </div>
  )
}
