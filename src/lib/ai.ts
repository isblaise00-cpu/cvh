/**
 * CVH — Module IA
 * Utilise OpenRouter (GRATUIT — modèles open source)
 * https://openrouter.ai/keys  ← obtenir une clé gratuite
 */

import type { AnalysisResult, ActionPlanStep, ContextAnalysisResult } from '@/types'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? ''
const MODEL = 'google/gemma-3-4b-it:free'

async function aiGenerate(content: string): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3005',
      'X-Title': 'CVH App',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content }],
      max_tokens: 2048,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(60000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter API : ${res.status} — ${err}`)
  }

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('Réponse OpenRouter invalide')
  return text
}

// ─── Analyse CV vs Fiche de poste ─────────────────────────────────────────────

export async function analyzeDocuments(
  cvText: string,
  jobText: string
): Promise<AnalysisResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY manquante dans .env.local')
  }

  const prompt = `Tu es un expert RH senior francophone. Analyse ce CV par rapport à la fiche de poste.
IMPORTANT : Réponds UNIQUEMENT en français. Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, sans markdown.

CV :
${cvText.slice(0, 6000)}

FICHE DE POSTE :
${jobText.slice(0, 3000)}

JSON attendu :
{
  "strengths": ["Force 1 concrète", "Force 2 concrète", "Force 3 concrète", "Force 4 concrète"],
  "weaknesses": ["Faiblesse 1 concrète", "Faiblesse 2 concrète", "Faiblesse 3 concrète", "Faiblesse 4 concrète"],
  "opportunities": ["Opportunité 1", "Opportunité 2", "Opportunité 3", "Opportunité 4"],
  "threats": ["Risque 1", "Risque 2", "Risque 3", "Risque 4"],
  "matchScore": 72,
  "summary": "Synthèse en 3 phrases du profil et de l'adéquation.",
  "actionPlan": [
    {"id": "1", "title": "Titre action", "description": "Description précise", "priority": "high", "timeframe": "1 mois", "category": "SKILLS"},
    {"id": "2", "title": "Titre action", "description": "Description précise", "priority": "high", "timeframe": "2 mois", "category": "PERFORMANCE"},
    {"id": "3", "title": "Titre action", "description": "Description précise", "priority": "medium", "timeframe": "3 mois", "category": "LEADERSHIP"},
    {"id": "4", "title": "Titre action", "description": "Description précise", "priority": "medium", "timeframe": "4 mois", "category": "CAREER"},
    {"id": "5", "title": "Titre action", "description": "Description précise", "priority": "low", "timeframe": "6 mois", "category": "COLLABORATION"}
  ]
}`

  const raw = await aiGenerate(prompt)

  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('[ai] Réponse brute:', raw.slice(0, 500))
    throw new Error('Réponse IA invalide — JSON introuvable')
  }

  return JSON.parse(jsonMatch[0]) as AnalysisResult
}

// ─── Plan d'action personnalisé ───────────────────────────────────────────────

export async function generateActionPlan(
  userName: string,
  strengths: string[],
  weaknesses: string[],
  objectives: string[]
): Promise<ActionPlanStep[]> {
  if (!process.env.OPENROUTER_API_KEY) return []

  const prompt = `Coach RH, génère un plan d'action 90 jours pour ${userName}.
Forces : ${strengths.slice(0, 3).join(' | ')}
Faiblesses : ${weaknesses.slice(0, 3).join(' | ')}
Objectifs : ${objectives.join(' | ')}

Réponds UNIQUEMENT avec ce tableau JSON, sans texte autour :
[
  {"id": "1", "title": "Titre", "description": "Action concrète", "priority": "high", "timeframe": "Semaine 1-2", "category": "SKILLS"},
  {"id": "2", "title": "Titre", "description": "Action concrète", "priority": "medium", "timeframe": "Semaine 3-4", "category": "LEADERSHIP"},
  {"id": "3", "title": "Titre", "description": "Action concrète", "priority": "low", "timeframe": "Mois 2", "category": "PERFORMANCE"},
  {"id": "4", "title": "Titre", "description": "Action concrète", "priority": "high", "timeframe": "Mois 2-3", "category": "CAREER"},
  {"id": "5", "title": "Titre", "description": "Action concrète", "priority": "medium", "timeframe": "Mois 3", "category": "COLLABORATION"},
  {"id": "6", "title": "Titre", "description": "Action concrète", "priority": "low", "timeframe": "Mois 3", "category": "WELLBEING"}
]`

  try {
    const raw = await aiGenerate(prompt)
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    return JSON.parse(jsonMatch[0]) as ActionPlanStep[]
  } catch {
    return []
  }
}

// ─── Analyse CV vs Contexte (situation économique / projet / département) ─────

export async function analyzeContextMatch(
  cvText: string,
  contextTitle: string,
  contextDesc: string,
): Promise<ContextAnalysisResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY manquante dans .env.local')
  }

  const prompt = `Tu es un expert en développement RH et en stratégie d'entreprise francophone.
Analyse le profil du collaborateur par rapport au contexte fourni et réponds UNIQUEMENT en français, UNIQUEMENT en JSON valide, sans texte avant ou après, sans markdown.

PROFIL DU COLLABORATEUR (CV) :
${cvText.slice(0, 6000)}

CONTEXTE : ${contextTitle}
${contextDesc.slice(0, 4000)}

Ta mission : évaluer dans quelle mesure ce collaborateur peut contribuer à ce contexte, identifier les écarts, et proposer un plan d'action pour atteindre une contribution optimale de 100%.

JSON attendu (réponds UNIQUEMENT ce JSON) :
{
  "currentScore": 68,
  "targetScore": 100,
  "summary": "Synthèse en 3-4 phrases : profil du collaborateur, niveau d'adéquation avec le contexte, potentiel.",
  "strengths": [
    "Atout concret du profil par rapport au contexte",
    "Atout concret 2",
    "Atout concret 3",
    "Atout concret 4"
  ],
  "gaps": [
    {
      "competence": "Nom de la compétence manquante",
      "niveau_actuel": 40,
      "niveau_cible": 100,
      "gap": 60,
      "action": "Action concrète pour combler cet écart"
    },
    {
      "competence": "Compétence 2",
      "niveau_actuel": 55,
      "niveau_cible": 100,
      "gap": 45,
      "action": "Action concrète"
    },
    {
      "competence": "Compétence 3",
      "niveau_actuel": 30,
      "niveau_cible": 100,
      "gap": 70,
      "action": "Action concrète"
    }
  ],
  "opportunities": [
    "Comment ce collaborateur peut concrètement contribuer au contexte",
    "Opportunité de contribution 2",
    "Opportunité de contribution 3"
  ],
  "risks": [
    "Point de vigilance ou risque identifié",
    "Risque 2",
    "Risque 3"
  ],
  "actionPlan": [
    {"id": "1", "title": "Action prioritaire", "description": "Description précise et actionnable", "priority": "high", "timeframe": "1 mois", "category": "SKILLS"},
    {"id": "2", "title": "Action 2", "description": "Description précise", "priority": "high", "timeframe": "2 mois", "category": "PERFORMANCE"},
    {"id": "3", "title": "Action 3", "description": "Description précise", "priority": "medium", "timeframe": "3 mois", "category": "LEADERSHIP"},
    {"id": "4", "title": "Action 4", "description": "Description précise", "priority": "medium", "timeframe": "4 mois", "category": "COLLABORATION"},
    {"id": "5", "title": "Action 5", "description": "Description précise", "priority": "low", "timeframe": "6 mois", "category": "CAREER"}
  ],
  "estimatedTimeline": "6-12 mois"
}`

  const raw = await aiGenerate(prompt)

  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('[ai-context] Réponse brute:', raw.slice(0, 500))
    throw new Error('Réponse IA invalide — JSON introuvable')
  }

  return JSON.parse(jsonMatch[0]) as ContextAnalysisResult
}

// ─── Suggestion IA pour un objectif ──────────────────────────────────────────

export async function suggestObjectiveImprovement(
  title: string,
  description: string,
  currentProgress: number
): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) return ''

  try {
    return await aiGenerate(
      `Coach RH, donne 2 conseils courts et pratiques (max 80 mots, ton encourageant) pour progresser sur cet objectif :
Objectif : "${title}"
Description : "${description}"
Progression actuelle : ${currentProgress}%`
    )
  } catch {
    return ''
  }
}
