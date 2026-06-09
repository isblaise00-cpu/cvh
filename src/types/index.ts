import type { User, Analysis, Objective, ActionPlan, Milestone } from '@prisma/client'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export interface AuthSession {
  user: {
    id: string
    email: string
    name: string | null
    image: string | null
    role: string
  }
  expires: string
}

// ─── User ─────────────────────────────────────────────────────────────────────

export type PublicUser = Omit<User, 'password' | 'cvContentEnc' | 'deletedAt'>

export interface OrgNode {
  id: string
  name: string | null
  email: string
  position: string | null
  department: string | null
  image: string | null
  role: string
  children: OrgNode[]
}

// ─── Analysis ─────────────────────────────────────────────────────────────────

export interface AnalysisRequest {
  cvFile?: File
  jobFile?: File
}

export interface AnalysisResult {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
  matchScore: number
  summary: string
  actionPlan: ActionPlanStep[]
}

export interface ActionPlanStep {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  timeframe: string
  category: string
}

export type FullAnalysis = Analysis & { actionPlan: ActionPlan | null }

// ─── Context Analysis ─────────────────────────────────────────────────────────

export type ContextType = 'company' | 'department' | 'project' | 'product' | 'economic'

export interface ContextGap {
  competence: string
  niveau_actuel: number  // 0-100
  niveau_cible: number   // toujours 100
  gap: number
  action: string
}

export interface ContextAnalysisResult {
  currentScore: number       // match actuel 0-100
  targetScore: 100
  summary: string
  strengths: string[]        // ce que la personne apporte au contexte
  gaps: ContextGap[]         // compétences manquantes pour atteindre 100%
  opportunities: string[]    // comment elle peut contribuer
  risks: string[]            // points de vigilance
  actionPlan: ActionPlanStep[] // plan pour atteindre 100%
  estimatedTimeline: string  // ex. "6-12 mois"
}

// ─── Objectives ───────────────────────────────────────────────────────────────

export interface CreateObjectiveInput {
  title: string
  description?: string
  category: string
  priority: string
  dueDate?: string
  milestones?: { title: string; dueDate?: string }[]
}

export interface UpdateObjectiveInput {
  title?: string
  description?: string
  status?: string
  progress?: number
  priority?: string
  dueDate?: string
}

export type FullObjective = Objective & { milestones: Milestone[] }

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: string
  code?: string
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

// ─── Abonnements ──────────────────────────────────────────────────────────────

export type PlanKey = 'FREE' | 'PRO' | 'TEAM'

export interface SubscriptionData {
  id: string
  userId: string
  plan: PlanKey
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  monthsPaid: number
  periodStart: Date
  periodEnd: Date
  yengaReference: string | null
  createdAt: Date
  updatedAt: Date
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalObjectives: number
  completedObjectives: number
  inProgressObjectives: number
  totalAnalyses: number
  lastAnalysisScore: number | null
  averageProgress: number
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

export interface ExportPayload {
  user: PublicUser
  analyses: FullAnalysis[]
  objectives: FullObjective[]
  generatedAt: string
}
