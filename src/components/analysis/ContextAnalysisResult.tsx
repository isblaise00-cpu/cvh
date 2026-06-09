'use client'

import type { ContextAnalysisResult } from '@/types'
import type { FullAnalysis } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  SKILLS: 'Compétences', LEADERSHIP: 'Leadership', PERFORMANCE: 'Performance',
  WELLBEING: 'Bien-être', CAREER: 'Carrière', COLLABORATION: 'Collaboration',
}
const CATEGORY_COLORS: Record<string, string> = {
  SKILLS: 'bg-blue-100 text-blue-700', LEADERSHIP: 'bg-purple-100 text-purple-700',
  PERFORMANCE: 'bg-green-100 text-green-700', WELLBEING: 'bg-yellow-100 text-yellow-700',
  CAREER: 'bg-red-100 text-red-700', COLLABORATION: 'bg-cyan-100 text-cyan-700',
}

function parseContextResult(analysis: FullAnalysis): ContextAnalysisResult | null {
  try {
    // Reconstruit le ContextAnalysisResult depuis les champs de l'analyse
    const gaps = analysis.weaknesses.map((w, i) => {
      const parts = w.split(' — ')
      const competence = parts[0] ?? `Compétence ${i + 1}`
      const gapMatch = parts[1]?.match(/gap:\s*(\d+)%/)
      const gap = gapMatch ? parseInt(gapMatch[1]) : 50
      const action = parts[2] ?? 'À définir'
      return {
        competence,
        niveau_actuel: 100 - gap,
        niveau_cible: 100,
        gap,
        action,
      }
    })

    return {
      currentScore: analysis.matchScore ?? 0,
      targetScore: 100,
      summary: analysis.summary ?? '',
      strengths: analysis.strengths,
      gaps,
      opportunities: analysis.opportunities,
      risks: analysis.threats,
      actionPlan: (analysis.actionPlan?.steps as never[]) ?? [],
      estimatedTimeline: '6-12 mois',
    }
  } catch {
    return null
  }
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-500'
  const barColor = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Niveau de contribution actuel</div>
      <div className={`text-6xl font-bold ${color} mb-1`}>{score}%</div>
      <div className="text-sm text-gray-500 mb-4">Objectif : <span className="font-bold text-gray-900">100%</span></div>

      {/* Barre de progression */}
      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${score}%` }}
        />
        <div className="absolute right-0 top-0 h-full w-0.5 bg-gray-400" style={{ right: '0%' }} />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>0%</span>
        <span className="font-medium text-gray-600">Gap à combler : {100 - score}%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

export default function ContextAnalysisResult({ analysis }: { analysis: FullAnalysis }) {
  const result = parseContextResult(analysis)
  if (!result) return null

  const contextTitle = analysis.jobFileName ?? 'Contexte'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1">
              Analyse CV vs Contexte
            </div>
            <h2 className="text-xl font-bold text-gray-900">{contextTitle}</h2>
            <div className="text-xs text-gray-400 mt-1">
              {new Date(analysis.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </div>
          </div>
          <div className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">
            Durée estimée : {result.estimatedTimeline}
          </div>
        </div>

        {/* Jauge de score */}
        <ScoreGauge score={result.currentScore} />

        {/* Synthèse */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="text-xs font-semibold text-blue-600 mb-1">Synthèse</div>
          <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
        </div>
      </div>

      {/* Forces & Opportunités */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💪</span>
            <div>
              <div className="font-semibold text-gray-900">Ce que vous apportez</div>
              <div className="text-xs text-gray-400">{result.strengths.length} atouts identifiés</div>
            </div>
          </div>
          <ul className="space-y-2">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <span className="text-gray-700">{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🚀</span>
            <div>
              <div className="font-semibold text-gray-900">Opportunités de contribution</div>
              <div className="text-xs text-gray-400">{result.opportunities.length} opportunités</div>
            </div>
          </div>
          <ul className="space-y-2">
            {result.opportunities.map((o, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <span className="text-gray-700">{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Gaps — compétences à développer */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📊</span>
          <div>
            <div className="font-semibold text-gray-900">Écarts à combler pour atteindre 100%</div>
            <div className="text-xs text-gray-400">{result.gaps.length} compétences à développer</div>
          </div>
        </div>
        <div className="space-y-4">
          {result.gaps.map((gap, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm text-gray-800">{gap.competence}</div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Actuel : <strong>{gap.niveau_actuel}%</strong></span>
                  <span className="text-gray-400">→</span>
                  <span className="text-green-600 font-bold">Cible : 100%</span>
                </div>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className="absolute left-0 top-0 h-full bg-primary-500 rounded-full"
                  style={{ width: `${gap.niveau_actuel}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 flex items-start gap-1">
                <span className="text-amber-500 flex-shrink-0">→</span>
                <span>{gap.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risques */}
      {result.risks.length > 0 && (
        <div className="card border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚠️</span>
            <div className="font-semibold text-gray-900">Points de vigilance</div>
          </div>
          <ul className="space-y-2">
            {result.risks.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <span className="text-gray-700">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Plan d'action vers 100% */}
      {result.actionPlan.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎯</span>
            <div>
              <div className="font-semibold text-gray-900">Plan d'action — Vers 100%</div>
              <div className="text-xs text-gray-400">{result.actionPlan.length} actions pour atteindre la contribution optimale</div>
            </div>
          </div>
          <div className="space-y-3">
            {result.actionPlan.map((step, i) => (
              <div key={i} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                  step.priority === 'high' ? 'bg-red-500' :
                  step.priority === 'medium' ? 'bg-orange-400' : 'bg-gray-400'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="font-medium text-sm text-gray-900">{step.title}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[step.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {CATEGORY_LABELS[step.category] ?? step.category}
                    </span>
                    <span className="text-xs text-gray-400">{step.priority === 'high' ? 'Prioritaire' : step.priority === 'medium' ? 'Important' : 'Optionnel'}</span>
                  </div>
                  <div className="text-xs text-gray-600">{step.description}</div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <span>⏱</span> {step.timeframe}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
