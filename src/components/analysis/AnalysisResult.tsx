'use client'

import type { FullAnalysis } from '@/types'
import type { ActionPlanStep } from '@/types'
import MLInsights from './MLInsights'

const SWOT_CONFIG = [
  {
    key: 'strengths',
    label: 'Forces',
    sublabel: 'Ce que le CV apporte au poste',
    icon: '↑',
    bg: 'bg-green-50',
    border: 'border-green-200',
    title: 'text-green-800',
    dot: 'bg-green-500',
    badge: 'bg-green-100 text-green-700',
  },
  {
    key: 'weaknesses',
    label: 'Faiblesses',
    sublabel: 'Écarts entre le CV et le poste',
    icon: '↓',
    bg: 'bg-red-50',
    border: 'border-red-200',
    title: 'text-red-800',
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
  },
  {
    key: 'opportunities',
    label: 'Opportunités',
    sublabel: 'Potentiels de développement',
    icon: '◎',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    title: 'text-blue-800',
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    key: 'threats',
    label: 'Risques',
    sublabel: 'Points de vigilance',
    icon: '⚠',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    title: 'text-orange-800',
    dot: 'bg-orange-500',
    badge: 'bg-orange-100 text-orange-700',
  },
] as const

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  high:   { label: 'Prioritaire', cls: 'bg-red-100 text-red-700' },
  medium: { label: 'Important',   cls: 'bg-orange-100 text-orange-700' },
  low:    { label: 'Utile',       cls: 'bg-blue-100 text-blue-700' },
}

const CATEGORY_ICONS: Record<string, string> = {
  SKILLS:        '🎯',
  LEADERSHIP:    '👥',
  PERFORMANCE:   '📈',
  WELLBEING:     '🌱',
  CAREER:        '🚀',
  COLLABORATION: '🤝',
}

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 75 ? 'text-green-600' :
    score >= 50 ? 'text-orange-500' :
    score >= 30 ? 'text-red-500' : 'text-red-700'

  const bgBar =
    score >= 75 ? 'bg-green-500' :
    score >= 50 ? 'bg-orange-400' :
    score >= 30 ? 'bg-red-400' : 'bg-red-600'

  const label =
    score >= 75 ? 'Bon candidat' :
    score >= 50 ? 'Partiellement adapté' :
    score >= 30 ? 'Profil éloigné' : 'Très éloigné du poste'

  return (
    <div className="card text-center py-8 mb-6">
      <div className={`text-7xl font-extrabold mb-2 ${color}`}>{score}%</div>
      <div className="text-gray-700 font-semibold text-lg mb-1">Score d'adéquation au poste</div>
      <div className={`text-sm font-medium mb-4 ${color}`}>{label}</div>
      <div className="w-64 mx-auto h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full progress-bar ${bgBar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export default function AnalysisResult({ analysis }: { analysis: FullAnalysis }) {
  const steps: ActionPlanStep[] = Array.isArray(analysis.actionPlan?.steps)
    ? (analysis.actionPlan!.steps as unknown as ActionPlanStep[])
    : []

  return (
    <div className="animate-slide-up space-y-6">

      {/* Score */}
      {analysis.matchScore !== null && analysis.matchScore !== undefined && (
        <ScoreGauge score={analysis.matchScore} />
      )}

      {/* Synthèse */}
      {analysis.summary && (
        <div className="card border-l-4 border-primary-500">
          <div className="text-xs font-semibold text-primary-600 mb-2 uppercase tracking-wide">Synthèse de l'analyse</div>
          <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
        </div>
      )}

      {/* SWOT */}
      <div>
        <h2 className="font-bold text-gray-900 text-lg mb-4">Analyse SWOT — CV vs Fiche de poste</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {SWOT_CONFIG.map(({ key, label, sublabel, icon, bg, border, title, dot, badge }) => {
            const items = (analysis[key as keyof typeof analysis] as string[]) ?? []
            return (
              <div key={key} className={`rounded-2xl p-5 border-2 ${bg} ${border}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className={`font-bold text-base flex items-center gap-1.5 ${title}`}>
                      <span>{icon}</span> {label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{sublabel}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge}`}>
                    {items.length} point{items.length > 1 ? 's' : ''}
                  </span>
                </div>
                <ul className="space-y-2">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      {/* Plan d'action */}
      {steps.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-900 text-lg mb-2">Plan d'action personnalisé</h2>
          <p className="text-sm text-gray-500 mb-5">
            Actions concrètes pour combler les écarts identifiés entre votre profil et le poste.
          </p>
          <div className="space-y-3">
            {steps.map((step, i) => {
              const prio = PRIORITY_CONFIG[step.priority] ?? PRIORITY_CONFIG.medium
              return (
                <div key={step.id ?? i} className="flex gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-600 text-white text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">{step.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${prio.cls}`}>
                        {prio.label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                        {CATEGORY_ICONS[step.category] ?? ''} {step.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 leading-relaxed">{step.description}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <span>⏱</span>
                      <span>{step.timeframe}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Analyse PyTorch */}
      <MLInsights analysisId={analysis.id} />

      {/* Export */}
      <div className="flex justify-center gap-3 pb-6">
        <a href="/api/export/pdf" className="btn-secondary text-sm">
          ⬇ Exporter le bilan en PDF
        </a>
        <a href="/objectives" className="btn-primary text-sm">
          ◎ Créer des objectifs depuis ce bilan →
        </a>
      </div>
    </div>
  )
}
