import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import bcrypt from 'bcryptjs'
import prisma from './db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 }, // 24h

  providers: [
    // ─── OAuth2 Google ──────────────────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ─── OAuth2 GitHub ──────────────────────────────────────────────────────
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    // ─── JWT Credentials ────────────────────────────────────────────────────
    CredentialsProvider({
      name: 'Identifiants',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email, deletedAt: null },
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role ?? 'EMPLOYEE'
      }
      // Fetch plan at login OR when session.update() is called from client
      if (user || trigger === 'update') {
        const userId = (token.id ?? user?.id) as string | undefined
        if (userId) {
          const sub = await prisma.subscription.findUnique({
            where: { userId },
            select: { plan: true, status: true, periodEnd: true },
          })
          const now = new Date()
          token.plan =
            sub?.status === 'ACTIVE' && sub.periodEnd > now ? sub.plan : 'FREE'
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { plan?: string }).plan = (token.plan as string) ?? 'FREE';
      }
      return session
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
}

// ─── Utilitaires Auth ──────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed)
}
