import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { getUserSubscription } from '@/lib/subscription'
import { PLAN_PRICES, PLAN_LABELS } from '@/lib/plans'

export default async function BillingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')
  const userId = (session.user as { id: string }).id

  const subscription = await getUserSubscription(userId)
  const plan = (subscription?.plan ?? 'FREE') as 'FREE' | 'PRO' | 'TEAM'
  const isActive = subscription?.status === 'ACTIVE'
  const isExpired = subscription?.status === 'EXPIRED'

  const periodEnd = subscription?.periodEnd
    ? new Date(subscription.periodEnd).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null

  const periodStart = subscription?.periodStart
    ? new Date(subscription.periodStart).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null

  const features: { label: string; value: string; ok?: boolean }[] = [
    {
      label: 'Analyses IA / mois',
      value: plan === 'FREE' ? '1 analyse' : 'Illimitées',
      ok: plan !== 'FREE',
    },
    {
      label: 'Objectifs',
      value: plan === 'FREE' ? '2 maximum' : 'Illimités',
      ok: plan !== 'FREE',
    },
    {
      label: 'Export PDF',
      value: plan !== 'FREE' ? 'Inclus' : 'Non disponible',
      ok: plan !== 'FREE',
    },
    {
      label: 'Suggestions IA avancées',
      value: plan !== 'FREE' ? 'Inclus' : 'Non disponible',
      ok: plan !== 'FREE',
    },
    {
      label: 'Organigramme',
      value: plan === 'TEAM' ? 'Inclus' : 'Non disponible',
      ok: plan === 'TEAM',
    },
  ]

  return (
    <AppShell>
      <div className="max-w-2xl animate-fade-in">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mon abonnement</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gérez votre plan et vos paiements</p>
        </div>

        {/* Plan actuel */}
        <div className="card mb-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Plan actuel
              </div>
              <div className="text-2xl font-bold text-gray-900">{PLAN_LABELS[plan]}</div>

              {isActive && plan !== 'FREE' && periodEnd && (
                <div className="text-sm text-gray-500 mt-1">
                  Actif jusqu&apos;au <span className="font-semibold text-gray-700">{periodEnd}</span>
                </div>
              )}
              {isExpired && (
                <div className="text-sm text-red-500 mt-1 font-medium">
                  Abonnement expiré — passez au plan Pro pour en bénéficier à nouveau
                </div>
              )}
              {plan === 'FREE' && (
                <div className="text-sm text-gray-400 mt-1">
                  Passez au Pro pour débloquer toutes les fonctionnalités
                </div>
              )}
            </div>

            <div className="text-right">
              {plan !== 'FREE' && (
                <div className="text-sm text-gray-500 mb-1">
                  {PLAN_PRICES[plan].toLocaleString('fr-FR')} FCFA/mois
                </div>
              )}
              <span className={`badge ${
                plan === 'TEAM'      ? 'badge-purple'  :
                plan === 'PRO' && isActive  ? 'badge-blue'   :
                isExpired           ? 'badge-red'    : 'badge-orange'
              }`}>
                {isExpired  ? 'Expiré'  :
                 plan === 'FREE' ? 'Gratuit' :
                 isActive   ? 'Actif'   : plan}
              </span>
            </div>
          </div>

          {/* Dates + référence */}
          {subscription && plan !== 'FREE' && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
              {periodStart && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Début</div>
                  <div className="text-gray-700 font-medium">{periodStart}</div>
                </div>
              )}
              {periodEnd && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Expiration</div>
                  <div className="text-gray-700 font-medium">{periodEnd}</div>
                </div>
              )}
              {subscription.monthsPaid > 0 && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Mois payés (total)</div>
                  <div className="text-gray-700 font-medium">{subscription.monthsPaid} mois</div>
                </div>
              )}
              {subscription.yengaReference && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Référence paiement</div>
                  <div className="text-xs font-mono text-gray-500 truncate">{subscription.yengaReference}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fonctionnalités incluses */}
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Fonctionnalités incluses</h2>
          <div className="divide-y divide-gray-50">
            {features.map(f => (
              <div key={f.label} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-gray-600">{f.label}</span>
                <span className={`text-sm font-medium ${
                  f.ok === true  ? 'text-green-600' :
                  f.ok === false ? 'text-gray-300'  : 'text-gray-900'
                }`}>
                  {f.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <Link href="/pricing" className="btn-primary">
            {plan === 'FREE' || isExpired
              ? 'Passer au plan Pro →'
              : 'Renouveler / Changer de plan →'}
          </Link>
          <Link href="/dashboard" className="btn-secondary">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
