'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import type { FullObjective } from '@/types'

const CATEGORIES = ['SKILLS', 'LEADERSHIP', 'PERFORMANCE', 'WELLBEING', 'CAREER', 'COLLABORATION']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Non démarré', IN_PROGRESS: 'En cours', COMPLETED: 'Terminé',
  BLOCKED: 'Bloqué', CANCELLED: 'Annulé',
}

export default function ObjectivesPage() {
  const [objectives, setObjectives] = useState<FullObjective[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'SKILLS', priority: 'MEDIUM', dueDate: '' })
  const [filterStatus, setFilterStatus] = useState('ALL')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/objectives')
    const d = await res.json()
    if (d.success) setObjectives(d.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/objectives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    if (d.success) {
      setObjectives((prev) => [d.data, ...prev])
      setShowForm(false)
      setForm({ title: '', description: '', category: 'SKILLS', priority: 'MEDIUM', dueDate: '' })
    }
    setSaving(false)
  }

  async function updateProgress(id: string, progress: number) {
    const status = progress === 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
    const res = await fetch(`/api/objectives/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress, status }),
    })
    const d = await res.json()
    if (d.success) setObjectives((prev) => prev.map((o) => o.id === id ? d.data : o))
  }

  async function deleteObjective(id: string) {
    if (!confirm('Supprimer cet objectif ?')) return
    await fetch(`/api/objectives/${id}`, { method: 'DELETE' })
    setObjectives((prev) => prev.filter((o) => o.id !== id))
  }

  const filtered = filterStatus === 'ALL' ? objectives : objectives.filter((o) => o.status === filterStatus)

  return (
    <AppShell>
      <div className="animate-fade-in">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Objectifs de développement</h1>
            <p className="text-gray-500 text-sm mt-0.5">{objectives.length} objectif{objectives.length > 1 ? 's' : ''} au total</p>
          </div>
          <button onClick={() => setShowForm((v) => !v)} className="btn-primary text-sm">
            {showForm ? '✕ Annuler' : '+ Nouvel objectif'}
          </button>
        </div>

        {/* Formulaire de création */}
        {showForm && (
          <div className="card mb-6 animate-slide-up">
            <h2 className="font-semibold text-gray-900 mb-4">Créer un objectif</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre *</label>
                <input className="input" placeholder="Ex : Maîtriser TypeScript avancé" value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea className="input resize-none" rows={2} placeholder="Détails, contexte, critères de succès…"
                  value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégorie</label>
                  <select className="input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Priorité</label>
                  <select className="input" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                    {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Échéance</label>
                  <input type="date" className="input" value={form.dueDate}
                    onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={saving} className="btn-primary text-sm">
                  {saving ? 'Création…' : 'Créer l\'objectif'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filtres */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['ALL', ...STATUSES].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${filterStatus === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s === 'ALL' ? 'Tous' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Liste des objectifs */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">◎</div>
            <p className="text-gray-500">Aucun objectif {filterStatus !== 'ALL' ? 'dans cette catégorie' : ''}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((obj) => (
              <div key={obj.id} className="card hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{obj.title}</span>
                      <span className="badge badge-blue text-xs">{obj.category}</span>
                      <span className={`badge text-xs ${
                        obj.priority === 'CRITICAL' ? 'badge-red' :
                        obj.priority === 'HIGH' ? 'badge-orange' :
                        obj.priority === 'MEDIUM' ? 'badge-blue' : 'bg-gray-100 text-gray-600'}`}>
                        {obj.priority}
                      </span>
                    </div>
                    {obj.description && (
                      <p className="text-sm text-gray-500 mb-3">{obj.description}</p>
                    )}

                    {/* Slider progression */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-24">Progression</span>
                      <input
                        type="range" min={0} max={100} step={5}
                        value={obj.progress}
                        onChange={(e) => updateProgress(obj.id, Number(e.target.value))}
                        className="flex-1 accent-primary-600"
                      />
                      <span className="text-sm font-bold text-primary-600 w-10 text-right">{obj.progress}%</span>
                    </div>

                    <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full progress-bar" style={{ width: `${obj.progress}%` }} />
                    </div>

                    {obj.aiSuggestion && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-xl text-xs text-blue-700 border border-blue-100">
                        💡 <strong>Suggestion IA :</strong> {obj.aiSuggestion}
                      </div>
                    )}
                  </div>

                  <button onClick={() => deleteObjective(obj.id)} className="text-gray-300 hover:text-red-500 transition text-lg flex-shrink-0" title="Supprimer">
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
