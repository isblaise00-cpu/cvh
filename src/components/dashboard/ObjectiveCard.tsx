import type { Objective, Milestone } from '@prisma/client'

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  NOT_STARTED: { label: 'Non démarré', cls: 'badge-blue' },
  IN_PROGRESS: { label: 'En cours', cls: 'badge-orange' },
  COMPLETED: { label: 'Terminé', cls: 'badge-green' },
  BLOCKED: { label: 'Bloqué', cls: 'badge-red' },
  CANCELLED: { label: 'Annulé', cls: 'text-gray-400' },
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-200',
  MEDIUM: 'bg-blue-400',
  HIGH: 'bg-orange-400',
  CRITICAL: 'bg-red-500',
}

interface Props {
  objective: Objective & { milestones: Milestone[] }
}

export default function ObjectiveCard({ objective: obj }: Props) {
  const status = STATUS_LABELS[obj.status] ?? STATUS_LABELS.NOT_STARTED
  const completedMilestones = obj.milestones.filter((m) => m.completed).length

  return (
    <div className="card hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[obj.priority]}`} title={obj.priority} />
          <span className={`badge text-xs ${status.cls}`}>{status.label}</span>
        </div>
        <span className="text-xs text-gray-400">{obj.category}</span>
      </div>

      <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{obj.title}</h3>
      {obj.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{obj.description}</p>
      )}

      {/* Barre de progression */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progression</span>
          <span className="font-medium">{obj.progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-500 progress-bar"
            style={{ width: `${obj.progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        {obj.milestones.length > 0 ? (
          <span>{completedMilestones}/{obj.milestones.length} jalons</span>
        ) : <span />}
        {obj.dueDate && (
          <span>Échéance : {new Date(obj.dueDate).toLocaleDateString('fr-FR')}</span>
        )}
      </div>

      {obj.aiSuggestion && (
        <div className="mt-3 p-2.5 bg-blue-50 rounded-xl text-xs text-blue-700 border border-blue-100">
          <span className="font-semibold">💡 IA :</span> {obj.aiSuggestion.slice(0, 100)}…
        </div>
      )}
    </div>
  )
}
