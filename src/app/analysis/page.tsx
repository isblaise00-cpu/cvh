'use client'

import { useState, useRef, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import AnalysisResult from '@/components/analysis/AnalysisResult'
import ContextAnalysisResult from '@/components/analysis/ContextAnalysisResult'
import type { FullAnalysis } from '@/types'

type AnalysisMode = 'CV_JOB' | 'CV_CONTEXT'
type ContextType = 'Entreprise' | 'Département' | 'Projet' | 'Produit' | 'Situation économique'

const CONTEXT_TYPES: ContextType[] = ['Entreprise', 'Département', 'Projet', 'Produit', 'Situation économique']

function FileDropzone({
  label, file, onFile, accept,
}: { label: string; file: File | null; onFile: (f: File) => void; accept: string }) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
        ${file ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}`}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]) }} />
      <div className="text-3xl mb-2">{file ? '✓' : '⬆'}</div>
      <div className="font-medium text-sm text-gray-700">{file ? file.name : label}</div>
      <div className="text-xs text-gray-400 mt-1">
        {file ? `${(file.size / 1024).toFixed(0)} Ko` : 'PDF, DOCX, TXT — Max 10 Mo'}
      </div>
    </div>
  )
}

export default function AnalysisPage() {
  const [mode, setMode] = useState<AnalysisMode>('CV_JOB')

  // CV vs Poste
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [jobFile, setJobFile] = useState<File | null>(null)

  // CV vs Contexte
  const [cvFileCtx, setCvFileCtx] = useState<File | null>(null)
  const [contextType, setContextType] = useState<ContextType>('Projet')
  const [contextTitle, setContextTitle] = useState('')
  const [contextDesc, setContextDesc] = useState('')
  const [contextFile, setContextFile] = useState<File | null>(null)

  const [loading, setLoading] = useState(false)
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [result, setResult] = useState<FullAnalysis | null>(null)
  const [error, setError] = useState('')
  const [analyses, setAnalyses] = useState<FullAnalysis[]>([])
  const [pollCount, setPollCount] = useState(0)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/analysis/analyze')
      .then((r) => r.json())
      .then((d) => { if (d.success) setAnalyses(d.data) })
  }, [result])

  useEffect(() => {
    if (!analysisId) return

    pollingRef.current = setInterval(async () => {
      setPollCount((n) => n + 1)
      const res = await fetch(`/api/analysis/analyze?id=${analysisId}`)
      const data = await res.json()

      if (!data.success) return

      if (data.data.status === 'COMPLETED') {
        setResult(data.data)
        setLoading(false)
        setAnalysisId(null)
        clearInterval(pollingRef.current!)
      } else if (data.data.status === 'FAILED') {
        const errDetail = data.data.summary ?? ''
        if (errDetail.includes('OPENROUTER_API_KEY')) {
          setError('Clé API OpenRouter manquante. Ajoutez OPENROUTER_API_KEY dans .env.local')
        } else if (errDetail.includes('JSON')) {
          setError("L'IA n'a pas pu analyser les documents. Vérifiez que vos fichiers contiennent du texte lisible.")
        } else {
          setError(errDetail || "L'analyse a échoué. Vérifiez vos fichiers et réessayez.")
        }
        setLoading(false)
        setAnalysisId(null)
        clearInterval(pollingRef.current!)
      }
    }, 3000)

    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [analysisId])

  async function handleSubmitJob(e: React.FormEvent) {
    e.preventDefault()
    if (!cvFile || !jobFile) return
    setError(''); setResult(null); setLoading(true); setPollCount(0)

    const formData = new FormData()
    formData.append('cv', cvFile)
    formData.append('job', jobFile)

    const res = await fetch('/api/analysis/upload', { method: 'POST', body: formData })
    const data = await res.json()

    if (!data.success) {
      setError(data.error ?? "Erreur lors de l'upload.")
      setLoading(false)
      return
    }
    setAnalysisId(data.data.analysisId)
  }

  async function handleSubmitContext(e: React.FormEvent) {
    e.preventDefault()
    if (!cvFileCtx || !contextTitle.trim() || (!contextDesc.trim() && !contextFile)) return
    setError(''); setResult(null); setLoading(true); setPollCount(0)

    const formData = new FormData()
    formData.append('cv', cvFileCtx)
    formData.append('contextTitle', `${contextType} : ${contextTitle}`)
    formData.append('contextDesc', contextDesc)
    if (contextFile) formData.append('contextFile', contextFile)

    const res = await fetch('/api/analysis/context', { method: 'POST', body: formData })
    const data = await res.json()

    if (!data.success) {
      setError(data.error ?? "Erreur lors de l'analyse.")
      setLoading(false)
      return
    }
    setAnalysisId(data.data.analysisId)
  }

  const POLL_MESSAGES_JOB = [
    "Lecture des documents…", "Analyse du CV en cours…",
    "Comparaison avec la fiche de poste…", "Identification des forces et faiblesses…",
    "Génération du plan d'action…", "Finalisation de l'analyse…",
  ]
  const POLL_MESSAGES_CTX = [
    "Lecture du CV…", "Analyse du contexte…",
    "Identification des écarts…", "Calcul du niveau de contribution…",
    "Génération du plan vers 100%…", "Finalisation…",
  ]
  const pollMsgs = mode === 'CV_JOB' ? POLL_MESSAGES_JOB : POLL_MESSAGES_CTX
  const pollMessage = pollMsgs[Math.min(Math.floor(pollCount / 2), pollMsgs.length - 1)]

  const isJobValid = !!cvFile && !!jobFile
  const isCtxValid = !!cvFileCtx && !!contextTitle.trim() && (!!contextDesc.trim() || !!contextFile)

  return (
    <AppShell>
      <div className="animate-fade-in max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Analyse IA</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Obtenez une analyse SWOT détaillée et un plan d'action personnalisé.
            <span className="ml-2 text-green-600 font-medium">Propulsé par OpenRouter — Gemma 3 (gratuit)</span>
          </p>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-6 w-fit">
          <button
            onClick={() => { setMode('CV_JOB'); setResult(null); setError('') }}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              mode === 'CV_JOB'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📄 CV vs Fiche de poste
          </button>
          <button
            onClick={() => { setMode('CV_CONTEXT'); setResult(null); setError('') }}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              mode === 'CV_CONTEXT'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🏢 CV vs Contexte / Projet
          </button>
        </div>

        {/* ── Mode 1 : CV vs Fiche de poste ── */}
        {mode === 'CV_JOB' && (
          <div className="card mb-6">
            <div className="mb-4">
              <h2 className="font-semibold text-gray-900">CV vs Fiche de poste</h2>
              <p className="text-xs text-gray-500 mt-0.5">Comparez votre profil avec un poste spécifique et obtenez votre score d'adéquation.</p>
            </div>
            <form onSubmit={handleSubmitJob}>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📄 Votre CV</label>
                  <FileDropzone label="Déposez votre CV ici" file={cvFile} onFile={setCvFile} accept=".pdf,.docx,.doc,.txt" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📋 Fiche de poste</label>
                  <FileDropzone label="Déposez la fiche de poste" file={jobFile} onFile={setJobFile} accept=".pdf,.docx,.doc,.txt" />
                </div>
              </div>
              {error && mode === 'CV_JOB' && <ErrorBox error={error} />}
              <SubmitButton loading={loading} disabled={!isJobValid || loading} pollMessage={pollMessage} pollCount={pollCount} />
            </form>
            {loading && <ProgressBar pollCount={pollCount} />}
          </div>
        )}

        {/* ── Mode 2 : CV vs Contexte ── */}
        {mode === 'CV_CONTEXT' && (
          <div className="card mb-6">
            <div className="mb-4">
              <h2 className="font-semibold text-gray-900">CV vs Contexte / Projet</h2>
              <p className="text-xs text-gray-500 mt-0.5">Évaluez votre contribution à une situation réelle et obtenez un plan pour atteindre 100%.</p>
            </div>
            <form onSubmit={handleSubmitContext} className="space-y-5">
              {/* CV */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📄 Votre CV</label>
                <FileDropzone label="Déposez votre CV ici" file={cvFileCtx} onFile={setCvFileCtx} accept=".pdf,.docx,.doc,.txt" />
              </div>

              {/* Type + Titre du contexte */}
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Type de contexte</label>
                  <select
                    value={contextType}
                    onChange={(e) => setContextType(e.target.value as ContextType)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
                  >
                    {CONTEXT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nom du {contextType.toLowerCase()}</label>
                  <input
                    type="text"
                    value={contextTitle}
                    onChange={(e) => setContextTitle(e.target.value)}
                    placeholder={`Ex : ${contextType === 'Projet' ? 'Transformation digitale 2026' : contextType === 'Entreprise' ? 'Orange Burkina Faso' : contextType === 'Département' ? 'Direction Commerciale B2B' : contextType === 'Produit' ? 'Application Mobile CVH' : 'Expansion marché Afrique de l\'Ouest'}`}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              </div>

              {/* Description du contexte */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description du contexte
                  <span className="text-gray-400 font-normal ml-2">— objectifs, défis, compétences recherchées, situation actuelle…</span>
                </label>
                <textarea
                  value={contextDesc}
                  onChange={(e) => setContextDesc(e.target.value)}
                  rows={5}
                  placeholder={`Décrivez la situation en détail :\n- Quels sont les objectifs du ${contextType.toLowerCase()} ?\n- Quels défis sont à relever ?\n- Quelles compétences sont nécessaires ?\n- Quel est le contexte économique ou organisationnel ?`}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                />
              </div>

              {/* Fichier contexte optionnel */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Document de contexte <span className="text-gray-400 font-normal">(optionnel — rapport, cahier des charges, note…)</span>
                </label>
                <FileDropzone label="Déposez un document de contexte (optionnel)" file={contextFile} onFile={setContextFile} accept=".pdf,.docx,.doc,.txt" />
              </div>

              {error && mode === 'CV_CONTEXT' && <ErrorBox error={error} />}
              <SubmitButton
                loading={loading}
                disabled={!isCtxValid || loading}
                pollMessage={pollMessage}
                pollCount={pollCount}
                label="🎯 Analyser ma contribution"
              />
            </form>
            {loading && <ProgressBar pollCount={pollCount} />}
          </div>
        )}

        {/* Résultat */}
        {result && (
          result.analysisType === 'CV_CONTEXT'
            ? <ContextAnalysisResult analysis={result} />
            : <AnalysisResult analysis={result} />
        )}

        {/* Historique */}
        {analyses.length > 0 && !result && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">Analyses précédentes</h2>
            <div className="space-y-3">
              {analyses.map((a) => (
                <button
                  key={a.id}
                  onClick={() => a.status === 'COMPLETED' ? setResult(a) : null}
                  disabled={a.status !== 'COMPLETED'}
                  className="w-full card text-left hover:shadow-md transition-all hover:border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {a.analysisType === 'CV_CONTEXT' ? '🏢' : '📄'}
                        </span>
                        <div className="font-medium text-sm">{a.cvFileName} · {a.jobFileName}</div>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(a.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {a.matchScore !== null && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary-600">{a.matchScore}%</div>
                          {a.analysisType === 'CV_CONTEXT' && (
                            <div className="text-xs text-gray-400">/ 100% cible</div>
                          )}
                        </div>
                      )}
                      <span className={`badge ${
                        a.status === 'COMPLETED' ? 'badge-green' :
                        a.status === 'PROCESSING' ? 'badge-blue' : 'badge-red'
                      }`}>
                        {a.status === 'COMPLETED' ? 'Terminée' :
                         a.status === 'PROCESSING' ? 'En cours…' : 'Échouée'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

function ErrorBox({ error }: { error: string }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-4">
      <div className="font-semibold mb-1">Erreur d'analyse</div>
      <div>{error}</div>
    </div>
  )
}

function SubmitButton({ loading, disabled, pollMessage, pollCount, label = "◈ Lancer l'analyse IA" }: {
  loading: boolean; disabled: boolean; pollMessage: string; pollCount: number; label?: string
}) {
  return (
    <button type="submit" disabled={disabled} className="btn-primary w-full justify-center">
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {pollMessage}
        </span>
      ) : label}
    </button>
  )
}

function ProgressBar({ pollCount }: { pollCount: number }) {
  return (
    <div className="mt-4">
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-1000"
          style={{ width: `${Math.min((pollCount / 12) * 100, 90)}%` }}
        />
      </div>
    </div>
  )
}
