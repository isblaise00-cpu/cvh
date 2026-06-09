'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', gdprConsent: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (!form.gdprConsent) {
      setError('Vous devez accepter la politique de confidentialité.')
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (!data.success) {
      setError(data.error ?? 'Une erreur est survenue.')
      return
    }

    router.push('/auth/login?registered=1')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-accent-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold text-white">C</div>
          </div>
          <h1 className="text-2xl font-bold text-white">Créer votre compte CVH</h1>
          <p className="text-white/60 text-sm mt-1">Gratuit — Aucune carte requise</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className="input"
                placeholder="Marie Dupont"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email professionnel</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="input"
                placeholder="marie@entreprise.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                className="input"
                placeholder="8 caractères minimum"
                required
              />
            </div>

            {/* Consentement RGPD */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.gdprConsent}
                onChange={(e) => update('gdprConsent', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                J'accepte la{' '}
                <span className="text-primary-600 font-medium">politique de confidentialité</span>{' '}
                et consens au traitement de mes données personnelles conformément au RGPD.
                Mes données sont chiffrées (AES-256) et ne sont jamais vendues à des tiers.
              </span>
            </label>

            <button type="submit" disabled={loading || !form.gdprConsent} className="btn-primary w-full justify-center">
              {loading ? 'Création…' : 'Créer mon compte →'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-primary-600 font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
