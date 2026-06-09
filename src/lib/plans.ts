// Constantes des plans — utilisables côté client ET serveur (pas d'imports Node.js)

export type PlanKey = 'FREE' | 'PRO' | 'TEAM'

export const PLAN_PRICES: Record<PlanKey, number> = {
  FREE: 0,
  PRO: 10_000,   // FCFA / mois
  TEAM: 15_000,  // FCFA / mois
}

export const PLAN_LABELS: Record<PlanKey, string> = {
  FREE: 'Gratuit',
  PRO: 'Pro',
  TEAM: 'Team',
}

export const PLAN_LIMITS: Record<PlanKey, {
  analysisPerMonth: number  // -1 = illimité
  maxObjectives: number     // -1 = illimité
  pdfExport: boolean
  orgChart: boolean
  aiSuggestions: boolean
}> = {
  FREE: {
    analysisPerMonth: 1,
    maxObjectives: 2,
    pdfExport: false,
    orgChart: false,
    aiSuggestions: false,
  },
  PRO: {
    analysisPerMonth: -1,
    maxObjectives: -1,
    pdfExport: true,
    orgChart: false,
    aiSuggestions: true,
  },
  TEAM: {
    analysisPerMonth: -1,
    maxObjectives: -1,
    pdfExport: true,
    orgChart: true,
    aiSuggestions: true,
  },
}
