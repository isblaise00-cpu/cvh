'use client'

import { Tree, TreeNode } from 'react-organizational-chart'
import type { OrgNode } from '@/types'

interface Props {
  nodes: OrgNode[]
  onSelect: (node: OrgNode) => void
}

function NodeCard({ node, onSelect }: { node: OrgNode; onSelect: (n: OrgNode) => void }) {
  return (
    <div
      onClick={() => onSelect(node)}
      className="org-node inline-block text-left"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600 flex-shrink-0">
          {node.name?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-900 truncate">{node.name ?? node.email}</div>
          <div className="text-xs text-gray-400 truncate">{node.position ?? node.role}</div>
        </div>
      </div>
    </div>
  )
}

function renderNode(node: OrgNode, onSelect: (n: OrgNode) => void): React.ReactNode {
  if (node.children.length === 0) {
    return (
      <TreeNode key={node.id} label={<NodeCard node={node} onSelect={onSelect} />} />
    )
  }

  return (
    <TreeNode key={node.id} label={<NodeCard node={node} onSelect={onSelect} />}>
      {node.children.map((child) => renderNode(child, onSelect))}
    </TreeNode>
  )
}

export default function OrgChartView({ nodes, onSelect }: Props) {
  if (nodes.length === 0) return null

  // S'il y a plusieurs racines, on crée un nœud virtuel
  const root = nodes.length === 1 ? nodes[0] : null
  const multi = nodes.length > 1

  if (root) {
    return (
      <div className="min-w-max p-8">
        <Tree
          lineWidth="2px"
          lineColor="#dbeafe"
          lineBorderRadius="8px"
          label={<NodeCard node={root} onSelect={onSelect} />}
        >
          {root.children.map((child) => renderNode(child, onSelect))}
        </Tree>
      </div>
    )
  }

  return (
    <div className="min-w-max p-8 flex gap-12">
      {nodes.map((root) => (
        <Tree
          key={root.id}
          lineWidth="2px"
          lineColor="#dbeafe"
          lineBorderRadius="8px"
          label={<NodeCard node={root} onSelect={onSelect} />}
        >
          {root.children.map((child) => renderNode(child, onSelect))}
        </Tree>
      ))}
    </div>
  )
}
