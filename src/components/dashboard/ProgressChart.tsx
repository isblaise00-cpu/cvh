'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface DataPoint { name: string; progress: number; category: string }

const CATEGORY_COLORS: Record<string, string> = {
  SKILLS: '#3b82f6',
  LEADERSHIP: '#8b5cf6',
  PERFORMANCE: '#10b981',
  WELLBEING: '#f59e0b',
  CAREER: '#ef4444',
  COLLABORATION: '#06b6d4',
}

export default function ProgressChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        Aucun objectif à afficher
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Tooltip
          formatter={(value) => [`${value}%`, 'Progression']}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="progress" radius={[6, 6, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={CATEGORY_COLORS[entry.category] ?? '#3b82f6'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
