// Route silencieuse pour les logs internes NextAuth (évite les erreurs 500 en console)
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ ok: true })
}
