import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/layout/Providers'

export const metadata: Metadata = {
  title: 'CVH — Catalyseur de Valeur Humaine',
  description: 'Plateforme RH augmentée par l\'IA pour révéler et développer le potentiel de chaque collaborateur.',
  keywords: ['RH', 'IA', 'développement', 'compétences', 'coaching', 'RGPD'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
