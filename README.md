# CVH — Catalyseur de Valeur Humaine

Application RH augmentée par l'IA pour révéler et développer le potentiel de chaque collaborateur.

## Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes (Node.js) |
| Base de données | PostgreSQL via Prisma ORM |
| Authentification | NextAuth.js — JWT + OAuth2 (Google, GitHub) |
| IA | Claude API (Anthropic) |
| Chiffrement | AES-256-CBC (Node.js crypto) |
| PDF | @react-pdf/renderer |
| Graphiques | Recharts |
| Organigramme | react-organizational-chart |

## Démarrage rapide

### 1. Prérequis

- Node.js 18+
- PostgreSQL 14+

### 2. Installation

```bash
cd cvh-app
npm install
```

### 3. Configuration

```bash
cp .env.example .env.local
# Éditez .env.local avec vos clés
```

Variables essentielles :
- `DATABASE_URL` — connexion PostgreSQL
- `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- `ANTHROPIC_API_KEY` — clé API Claude
- `ENCRYPTION_KEY` — `openssl rand -hex 32`
- `ENCRYPTION_IV` — `openssl rand -hex 16`

### 4. Base de données

```bash
npm run db:generate   # génère le client Prisma
npm run db:push       # crée les tables
```

### 5. Lancement

```bash
npm run dev           # http://localhost:3000
```

## Architecture

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── page.tsx            # Landing page
│   ├── auth/               # Login / Register
│   ├── dashboard/          # Tableau de bord
│   ├── analysis/           # Upload + analyse IA
│   ├── objectives/         # Gestion des objectifs
│   ├── org-chart/          # Organigramme interactif
│   └── api/                # Routes API REST
│       ├── auth/           # NextAuth + inscription
│       ├── analysis/       # Upload + polling
│       ├── objectives/     # CRUD objectifs
│       ├── org-chart/      # Arbre hiérarchique
│       └── export/pdf/     # Export PDF
├── components/             # Composants React
├── lib/                    # Utilitaires serveur
│   ├── ai.ts               # Intégration Claude API
│   ├── auth.ts             # NextAuth config
│   ├── db.ts               # Singleton Prisma
│   ├── encryption.ts       # AES-256-CBC
│   ├── file-parser.ts      # PDF/DOCX → texte
│   └── pdf-export.ts       # Génération PDF
├── middleware.ts            # Protection routes + headers sécurité
└── types/                  # Types TypeScript partagés
```

## Fonctionnalités

- **Authentification** : Email/mot de passe + OAuth2 Google/GitHub (JWT)
- **Analyse IA** : Upload CV + fiche de poste → SWOT + score + plan d'action
- **Objectifs** : CRUD avec progression, jalons, suggestions IA
- **Dashboard** : KPIs, graphiques, historique analyses
- **Organigramme** : Vue arborescente interactive cliquable
- **Export PDF** : Bilan complet (profil, SWOT, objectifs)
- **Sécurité** : AES-256, RGPD (consentement, suppression douce, pseudonymisation)

## Conformité RGPD

- Consentement explicite à l'inscription
- Données sensibles chiffrées AES-256
- Suppression douce (`deletedAt`)
- Pseudonymisation des logs
- Headers de sécurité (CSP, X-Frame-Options…)
- Export des données utilisateur via PDF
