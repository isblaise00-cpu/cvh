import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/db'
import AppShell from '@/components/layout/AppShell'
import StatsCard from '@/components/dashboard/StatsCard'
import ProgressChart from '@/components/dashboard/ProgressChart'
import ObjectiveCard from '@/components/dashboard/ObjectiveCard'
import Link from 'next/link'
import { getEffectivePlan } from '@/lib/subscription'
import { PLAN_LIMITS, PLAN_LABELS } from '@/lib/plans'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/login')
  const userId = (session.user as { id: string }).id

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [objectives, analyses, plan, analysesThisMonth] = await Promise.all([
    prisma.objective.findMany({ where: { userId }, include: { milestones: true }, orderBy: { updatedAt: 'desc' } }),
    prisma.analysis.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    getEffectivePlan(userId),
    prisma.analysis.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
  ])

  const limits = PLAN_LIMITS[plan]

  const completed = objectives.filter((o) => o.status === 'COMPLETED').length
  const inProgress = objectives.filter((o) => o.status === 'IN_PROGRESS').length
  const avgProgress = objectives.length
    ? Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)
    : 0
  const latestScore = analyses.find((a) => a.matchScore !== null)?.matchScore ?? null

  const recentObjectives = objectives.slice(0, 4)

  const chartData = objectives.map((o) => ({
    name: o.title.slice(0, 20),
    progress: o.progress,
    category: o.category,
  }))

  return (
    <AppShell>
      <div className="animate-fade-in">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bonjour, {session.user.name?.split(' ')[0] ?? 'Collaborateur'} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Voici votre tableau de bord de développement</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/api/export/pdf" className="btn-secondary text-sm">
              ⬇ Exporter PDF
            </Link>
            <Link href="/analysis" className="btn-primary text-sm">
              + Nouvelle analyse
            </Link>
          </div>
        </div>

        {/* Quotas */}
        <div className={`mb-6 rounded-2xl border px-5 py-4 flex flex-wrap items-center gap-4 justify-between ${plan === 'FREE' ? 'bg-amber-50 border-amber-200' : 'bg-primary-50 border-primary-200'}`}>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${plan === 'FREE' ? 'bg-amber-200 text-amber-800' : plan === 'PRO' ? 'bg-primary-200 text-primary-800' : 'bg-purple-200 text-purple-800'}`}>
              {PLAN_LABELS[plan]}
            </span>
            {/* Analyses */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Analyses ce mois :</span>
              <span className="text-xs font-bold text-gray-900">
                {analysesThisMonth} / {limits.analysisPerMonth === -1 ? '∞' : limits.analysisPerMonth}
              </span>
              {limits.analysisPerMonth !== -1 && (
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${analysesThisMonth >= limits.analysisPerMonth ? 'bg-red-500' : 'bg-primary-500'}`}
                    style={{ width: `${Math.min((analysesThisMonth / limits.analysisPerMonth) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
            {/* Objectifs */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Objectifs :</span>
              <span className="text-xs font-bold text-gray-900">
                {objectives.length} / {limits.maxObjectives === -1 ? '∞' : limits.maxObjectives}
              </span>
              {limits.maxObjectives !== -1 && (
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${objectives.length >= limits.maxObjectives ? 'bg-red-500' : 'bg-primary-500'}`}
                    style={{ width: `${Math.min((objectives.length / limits.maxObjectives) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
          {plan === 'FREE' && (
            <Link href="/pricing" className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2 whitespace-nowrap">
              Passer au Pro →
            </Link>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Objectifs actifs"
            value={objectives.length}
            icon="◎"
            color="blue"
            trend={`${inProgress} en cours`}
          />
          <StatsCard
            title="Taux de complétion"
            value={`${objectives.length ? Math.round((completed / objectives.length) * 100) : 0}%`}
            icon="✓"
            color="green"
            trend={`${completed} objectifs atteints`}
          />
          <StatsCard
            title="Progression moyenne"
            value={`${avgProgress}%`}
            icon="↑"
            color="purple"
            trend="Sur tous les objectifs"
          />
          <StatsCard
            title="Score d'adéquation"
            value={latestScore !== null ? `${latestScore}%` : 'N/A'}
            icon="◈"
            color="orange"
            trend={analyses.length ? 'Dernière analyse IA' : 'Aucune analyse'}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Graphique */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Progression des objectifs</h2>
              <Link href="/objectives" className="text-xs text-primary-600 hover:underline">Voir tout →</Link>
            </div>
            <ProgressChart data={chartData} />
          </div>

          {/* Analyses récentes */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Analyses récentes</h2>
            {analyses.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">◈</div>
                <p className="text-gray-500 text-sm">Aucune analyse</p>
                <Link href="/analysis" className="btn-primary text-xs mt-4 inline-flex">
                  Lancer une analyse
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {analyses.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <div className="text-xs font-medium text-gray-700 truncate max-w-[140px]">
                        {a.cvFileName ?? 'CV'}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.matchScore !== null && (
                        <span className="text-sm font-bold text-primary-600">{a.matchScore}%</span>
                      )}
                      <span className={`badge text-xs ${
                        a.status === 'COMPLETED' ? 'badge-green' :
                        a.status === 'PROCESSING' ? 'badge-blue' : 'badge-red'
                      }`}>
                        {a.status === 'COMPLETED' ? '✓' : a.status === 'PROCESSING' ? '⟳' : '✗'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Objectifs récents */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Objectifs en cours</h2>
            <Link href="/objectives" className="text-xs text-primary-600 hover:underline">Gérer →</Link>
          </div>
          {recentObjectives.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">◎</div>
              <p className="text-gray-500 mb-4">Commencez par définir vos objectifs de développement</p>
              <Link href="/objectives" className="btn-primary text-sm inline-flex">Créer un objectif</Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {recentObjectives.map((obj) => (
                <ObjectiveCard key={obj.id} objective={obj} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
