type Color = 'blue' | 'green' | 'purple' | 'orange'

const colorMap: Record<Color, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
}

interface Props {
  title: string
  value: string | number
  icon: string
  color: Color
  trend?: string
}

export default function StatsCard({ title, value, icon, color, trend }: Props) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="text-sm font-medium text-gray-700">{title}</div>
      {trend && <div className="text-xs text-gray-400 mt-1">{trend}</div>}
    </div>
  )
}
