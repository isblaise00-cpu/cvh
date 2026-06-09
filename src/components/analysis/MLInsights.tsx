'use client'

import { useState, useEffect } from 'react'

interface MLResult {
  recommended_category: string
  confidence: number
  distribution: Record<string, number>
  competence_scores: Record<string, number>
  action_priorities: {
    rang: number
    categorie: string
    score: number
    action: string
    priorite: string
  }[]
  interpretation: string
}

const CATEGORY_LABELS: Record<string, string> = {
  SKILLS:        'Compétences techniques',
  LEADERSHIP:    'Leadership',
  PERFORMANCE:   'Performance',
  WELLBEING:     'Bien-être',
  CAREER:        'Carrière',
  COLLABORATION: 'Collaboration',
}

const CATEGORY_COLORS: Record<string, string> = {
  SKILLS:        'bg-blue-500',
  LEADERSHIP:    'bg-purple-500',
  PERFORMANCE:   'bg-green-500',
  WELLBEING:     'bg-yellow-500',
  CAREER:        'bg-red-500',
  COLLABORATION: 'bg-cyan-500',
}

const COMPETENCE_LABELS: Record<string, string> = {
  score_technique:     'Technique',
  score_communication: 'Communication',
  score_leadership:    'Leadership',
  score_organisation:  'Organisation',
  score_creativite:    'Créativité',
  score_analytique:    'Analytique',
}

export default function MLInsights({ analysisId }: { analysisId: string }) {
  const [result, setResult] = useState<MLResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [serviceOnline, setServiceOnline] = useState<boolean | null>(null)

  // Vérifie si le microservice Python est actif
  useEffect(() => {
    fetch('/api/analysis/ml')
      .then((r) => r.json())
      .then((d) => setServiceOnline(d.success))
      .catch(() => setServiceOnline(false))
  }, [])

  async function runMLAnalysis() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/analysis/ml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error ?? 'Erreur du microservice IA')
        return
      }
      setResult(data.data)
    } catch {
      setError('Erreur de connexion au microservice Python')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card mt-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <span>⚡</span> Analyse PyTorch
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Réseau de neurones — scikit-learn + PyTorch
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Indicateur de statut du microservice */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`w-2 h-2 rounded-full ${
              serviceOnline === null ? 'bg-gray-300' :
              serviceOnline ? 'bg-green-500 animate-pulse' : 'bg-red-400'
            }`} />
            <span className="text-gray-500">
              {serviceOnline === null ? 'Vérification…' :
               serviceOnline ? 'Microservice actif' : 'Hors ligne'}
            </span>
          </div>

          <button
            onClick={runMLAnalysis}
            disabled={loading || serviceOnline === false}
            className="btn-primary text-sm"
            title={serviceOnline === false ? 'Lancez python-ai/main.py' : ''}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyse…
              </span>
            ) : '⚡ Analyser avec PyTorch'}
          </button>
        </div>
      </div>

      {/* Microservice hors ligne */}
      {serviceOnline === false && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 mb-4">
          <div className="font-semibold mb-1">Microservice Python non démarré</div>
          <div className="font-mono text-xs bg-amber-100 p-2 rounded">
            cd cvh-app/python-ai<br />
            pip install -r requirements.txt<br />
            python main.py
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Résultats */}
      {result && (
        <div className="space-y-5 animate-slide-up">
          {/* Interprétation */}
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <div className="text-xs font-semibold text-indigo-600 mb-1">Interprétation du modèle</div>
            <p className="text-sm text-gray-700">{result.interpretation}</p>
          </div>

          {/* Catégorie recommandée + confiance */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className={`w-14 h-14 rounded-2xl ${CATEGORY_COLORS[result.recommended_category] ?? 'bg-gray-400'} flex items-center justify-center text-white text-2xl`}>
              ◎
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Catégorie prioritaire recommandée</div>
              <div className="font-bold text-gray-900 text-lg">
                {CATEGORY_LABELS[result.recommended_category] ?? result.recommended_category}
              </div>
              <div className="text-sm text-gray-500">Confiance du modèle : <strong className="text-indigo-600">{result.confidence}%</strong></div>
            </div>
          </div>

          {/* Distribution probabiliste */}
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-3">Distribution des probabilités</div>
            <div className="space-y-2">
              {Object.entries(result.distribution)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, pct]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-gray-600 text-right flex-shrink-0">
                      {CATEGORY_LABELS[cat] ?? cat}
                    </div>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full progress-bar ${CATEGORY_COLORS[cat] ?? 'bg-gray-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-10 text-xs font-medium text-gray-700">{pct}%</div>
                  </div>
                ))}
            </div>
          </div>

          {/* Scores de compétences extraits */}
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-3">Scores de compétences (extraits du SWOT)</div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(result.competence_scores).map(([key, score]) => (
                <div key={key} className="p-3 bg-gray-50 rounded-xl text-center">
                  <div className="text-lg font-bold text-primary-600">{Math.round(score * 100)}%</div>
                  <div className="text-xs text-gray-500 mt-0.5">{COMPETENCE_LABELS[key] ?? key}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions priorisées */}
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-3">Plan d'action priorisé par le modèle</div>
            <div className="space-y-2">
              {result.action_priorities.slice(0, 4).map((action) => (
                <div key={action.rang} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                    action.priorite === 'HIGH' ? 'bg-red-500' :
                    action.priorite === 'MEDIUM' ? 'bg-orange-400' : 'bg-gray-400'
                  }`}>
                    {action.rang}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-700">{action.action}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {CATEGORY_LABELS[action.categorie]} · {action.score}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!result && !loading && serviceOnline && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-3">⚡</div>
          <p className="text-sm">Cliquez sur "Analyser avec PyTorch" pour enrichir l'analyse Claude avec le modèle de réseau de neurones.</p>
        </div>
      )}
    </div>
  )
}
