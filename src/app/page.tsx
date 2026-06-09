import Link from 'next/link'

export default function LandingPage() {
  const features = [
    { icon: '◈', title: 'Analyse IA SWOT', desc: 'Analysez CV et fiches de poste avec Claude pour identifier forces, faiblesses, opportunités et risques en quelques secondes.' },
    { icon: '◎', title: 'Suivi des objectifs', desc: 'Définissez des objectifs SMART, suivez leur progression et recevez des suggestions IA personnalisées.' },
    { icon: '❋', title: 'Organigramme interactif', desc: 'Visualisez la hiérarchie de votre organisation avec une vue arborescente interactive.' },
    { icon: '⬡', title: 'Plans d\'action auto', desc: 'L\'IA génère automatiquement un plan d\'action sur 90 jours adapté à chaque collaborateur.' },
    { icon: '⊡', title: 'Export PDF', desc: 'Exportez des bilans complets en PDF pour les entretiens annuels et revues de performance.' },
    { icon: '⊕', title: 'Conformité RGPD', desc: 'Chiffrement AES-256, suppression douce, consentement explicite — vos données sont protégées.' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-accent-600 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold">C</div>
          <span className="font-bold text-lg">CVH</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="text-white/80 hover:text-white transition text-sm font-medium">
            Connexion
          </Link>
          <Link href="/auth/register" className="px-5 py-2 bg-white text-primary-900 rounded-xl text-sm font-semibold hover:bg-primary-50 transition">
            Commencer gratuitement
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="text-center px-8 py-24 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          Propulsé par Claude — Anthropic
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
          Catalyseur de<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
            Valeur Humaine
          </span>
        </h1>
        <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
          La plateforme RH augmentée par l'IA qui révèle le potentiel de chaque collaborateur,
          aligne les talents sur les postes et accélère le développement professionnel.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/auth/register" className="px-8 py-4 bg-white text-primary-900 rounded-2xl font-bold text-lg hover:bg-primary-50 transition shadow-xl">
            Démarrer l'analyse →
          </Link>
          <Link href="#features" className="px-8 py-4 bg-white/10 rounded-2xl font-semibold text-lg hover:bg-white/20 transition">
            En savoir plus
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-white/10">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-8 text-center px-8">
          {[
            { value: '< 30s', label: 'Analyse IA complète' },
            { value: 'AES-256', label: 'Chiffrement des données' },
            { value: 'RGPD', label: 'Conformité totale' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl font-extrabold">{stat.value}</div>
              <div className="text-white/60 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">Tout ce qu'il vous faut</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white/10 backdrop-blur rounded-2xl p-6 hover:bg-white/15 transition-all">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-white/70 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-20 px-8">
        <h2 className="text-3xl font-bold mb-4">Prêt à révéler votre potentiel ?</h2>
        <p className="text-white/60 mb-8">Créez votre compte gratuitement — aucune carte requise.</p>
        <Link href="/auth/register" className="px-10 py-4 bg-white text-primary-900 rounded-2xl font-bold text-lg hover:bg-primary-50 transition shadow-xl">
          Créer mon espace →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-8 text-center text-white/40 text-sm">
        © 2026 CVH — Catalyseur de Valeur Humaine · Données chiffrées · Conformité RGPD
      </footer>
    </div>
  )
}
