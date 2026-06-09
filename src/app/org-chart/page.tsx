'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import OrgChartView from '@/components/org-chart/OrgChartView'
import type { OrgNode } from '@/types'

export default function OrgChartPage() {
  const [tree, setTree] = useState<OrgNode[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<OrgNode | null>(null)

  useEffect(() => {
    fetch('/api/org-chart')
      .then((r) => r.json())
      .then((d) => { if (d.success) setTree(d.data) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppShell>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organigramme</h1>
            <p className="text-gray-500 text-sm mt-0.5">Vue hiérarchique interactive de l'organisation</p>
          </div>
        </div>

        {loading ? (
          <div className="card text-center py-20 text-gray-400">Chargement de l'organigramme…</div>
        ) : tree.length === 0 ? (
          <div className="card text-center py-20">
            <div className="text-5xl mb-4">❋</div>
            <p className="text-gray-500">L'organigramme est vide. Assignez des managers aux utilisateurs pour le construire.</p>
          </div>
        ) : (
          <div className="card overflow-auto">
            <OrgChartView nodes={tree} onSelect={setSelected} />
          </div>
        )}

        {/* Panneau de détail */}
        {selected && (
          <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl border-l border-gray-100 p-6 z-50 animate-fade-in overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-gray-900">Profil</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 text-2xl">×</button>
            </div>

            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-600 mx-auto mb-3">
                {selected.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <h3 className="font-bold text-gray-900">{selected.name ?? 'Nom inconnu'}</h3>
              <p className="text-sm text-gray-500">{selected.position ?? 'Poste non renseigné'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{selected.department ?? 'Département non renseigné'}</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-800 truncate ml-2">{selected.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Rôle</span>
                <span className="badge badge-blue">{selected.role}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Équipe directe</span>
                <span className="font-medium">{selected.children.length} personne{selected.children.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
