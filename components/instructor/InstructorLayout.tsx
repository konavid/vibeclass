'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useEffect } from 'react'

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()

  const navigation = [
    { name: '대시보드', href: '/instructor', icon: '📊' },
    { name: '내 프로필', href: '/instructor/profile', icon: '👤' },
    { name: '강의 관리', href: '/instructor/courses', icon: '📚' },
    { name: '문의 관리', href: '/instructor/qna', icon: '💬' },
  ]

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  // 강사 또는 관리자 권한 체크
  if (session?.user?.role !== 'instructor' && session?.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h1>
          <p className="text-gray-600 mb-4">강사만 접근할 수 있는 페이지입니다.</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            메인 페이지로 이동
          </Link>
        </div>
      </div>
    )
  }

  const isAdmin = session?.user?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 상단 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center">
              <img
                src="/logo.png"
                alt="바이브 클래스"
                className="h-8 w-auto"
              />
            </Link>
            <span className="text-sm font-medium text-gray-500 border-l pl-3">강사</span>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                관리자 페이지
              </Link>
            )}
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              사이트 보기
            </Link>
            <span className="text-sm text-gray-600">{session?.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 사이드바 */}
        <aside className="w-64 bg-white min-h-screen border-r border-gray-200">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/instructor' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
