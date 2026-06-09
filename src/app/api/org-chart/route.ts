import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import type { OrgNode } from '@/types'
import { checkPlanFeature } from '@/lib/subscription'

function buildTree(users: {
  id: string; name: string | null; email: string; position: string | null
  department: string | null; image: string | null; role: string; managerId: string | null
}[]): OrgNode[] {
  const map = new Map<string, OrgNode>()
  const roots: OrgNode[] = []

  for (const u of users) {
    map.set(u.id, { ...u, children: [] })
  }

  for (const u of users) {
    const node = map.get(u.id)!
    if (u.managerId && map.has(u.managerId)) {
      map.get(u.managerId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ success: false, error: 'Non authentifié.' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const planCheck = await checkPlanFeature(userId, 'orgChart')
  if (!planCheck.allowed) {
    return NextResponse.json({ success: false, error: planCheck.reason }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true, position: true, department: true, image: true, role: true, managerId: true },
    orderBy: { name: 'asc' },
  })

  const tree = buildTree(users)
  return NextResponse.json({ success: true, data: tree })
}
