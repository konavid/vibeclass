import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === 'admin'
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
    const isRegisterRoute = req.nextUrl.pathname === '/register'
    const isLoginRoute = req.nextUrl.pathname === '/login'
    const isAdminLoginRoute = req.nextUrl.pathname === '/admin/login'
    const isApiRoute = req.nextUrl.pathname.startsWith('/api')
    // 일반 사용자: 프로필이 완성되지 않은 경우 /register로 리다이렉트
    if (token && !token.profileCompleted && !isAdminRoute && !isRegisterRoute && !isLoginRoute && !isApiRoute) {
      return NextResponse.redirect(new URL('/register', req.url))
    }

    // Admin 라우트: admin 권한 필요, 없으면 로그인 페이지로
    if (isAdminRoute && !isAdminLoginRoute && !isAdmin) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        // Allow access to login pages without auth
        if (pathname === '/login' || pathname === '/register' || pathname === '/admin/login') {
          return true
        }
        // Allow root path (will be redirected by middleware)
        if (pathname === '/') {
          return true
        }
        // Require auth for admin routes
        if (pathname.startsWith('/admin')) {
          return !!token
        }
        // Require auth for /my routes and /consultation
        if (pathname.startsWith('/my') || pathname === '/consultation') {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/', '/admin/:path*', '/login', '/register', '/my/:path*', '/consultation'],
}
