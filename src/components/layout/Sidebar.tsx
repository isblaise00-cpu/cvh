'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

const NAV_ITEMS = [
  { href: '/dashboard',        label: 'Tableau de bord',  icon: '⊞' },
  { href: '/analysis',         label: 'Analyse IA',        icon: '◈' },
  { href: '/objectives',       label: 'Objectifs',         icon: '◎' },
  { href: '/org-chart',        label: 'Organigramme',      icon: '❋' },
  { href: '/settings/billing', label: 'Abonnement',        icon: '⬡' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user as { name?: string; email?: string; image?: string; role?: string; plan?: string } | undefined
  const plan = user?.plan ?? 'FREE'
  const planLabel: Record<string, string> = { FREE: 'Gratuit', PRO: 'Pro', TEAM: 'Team' }

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-primary-900 text-white flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-primary-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-xl font-bold">
            C
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">Catalyseur de</div>
            <div className="font-bold text-sm leading-tight text-primary-300">Valeur Humaine</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150
                ${active
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Profil + déconnexion */}
      <div className="p-4 border-t border-primary-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.name ?? 'Utilisateur'}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-primary-400 truncate">{user?.role ?? 'EMPLOYEE'}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                plan === 'TEAM' ? 'bg-purple-500/30 text-purple-200' :
                plan === 'PRO'  ? 'bg-blue-500/30 text-blue-200'     :
                                  'bg-primary-700 text-primary-300'
              }`}>
                {planLabel[plan] ?? plan}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primary-300 hover:text-white hover:bg-primary-800 rounded-lg transition-all"
        >
          <span>⏻</span> Déconnexion
        </button>
      </div>
    </aside>
  )
}
