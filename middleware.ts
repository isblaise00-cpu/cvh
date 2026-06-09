import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Redirection admin — accès restreint
    if (pathname.startsWith('/admin') && token?.role !== 'ADMIN' && token?.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Headers de sécurité RGPD / CSP
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    )
    return response
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/analysis/:path*',
    '/objectives/:path*',
    '/org-chart/:path*',
    '/settings/:path*',
    '/api/analysis/:path*',
    '/api/objectives/:path*',
    '/api/org-chart/:path*',
    '/api/export/:path*',
    '/api/payment/:path*',
    '/api/subscription/:path*',
  ],
}
