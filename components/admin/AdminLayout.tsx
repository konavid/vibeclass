'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface MenuItem {
  name: string
  href: string
  icon: string
}

interface MenuGroup {
  name: string
  icon: string
  items: MenuItem[]
}

type NavigationItem = MenuItem | MenuGroup

function isMenuGroup(item: NavigationItem): item is MenuGroup {
  return 'items' in item
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [openGroups, setOpenGroups] = useState<string[]>(['강의', '사용자', '수강/결제', '마케팅'])

  const navigation: NavigationItem[] = [
    { name: '대시보드', href: '/admin', icon: '📊' },
    {
      name: '강의',
      icon: '📚',
      items: [
        { name: '강의 관리', href: '/admin/courses', icon: '📖' },
        { name: '카테고리', href: '/admin/categories', icon: '🏷️' },
      ]
    },
    {
      name: '사용자',
      icon: '👥',
      items: [
        { name: '회원 관리', href: '/admin/users', icon: '👤' },
        { name: '강사 관리', href: '/admin/instructors', icon: '👨‍🏫' },
        { name: '강사 신청', href: '/admin/instructor-applications', icon: '📋' },
      ]
    },
    {
      name: '수강/결제',
      icon: '💳',
      items: [
        { name: '수강 관리', href: '/admin/enrollments', icon: '✅' },
        { name: '결제 관리', href: '/admin/payments', icon: '💰' },
      ]
    },
    {
      name: '커뮤니티',
      icon: '💬',
      items: [
        { name: '후기 관리', href: '/admin/reviews', icon: '⭐' },
        { name: 'Q&A 관리', href: '/admin/qna', icon: '❓' },
        { name: '컨설팅', href: '/admin/consultings', icon: '🗣️' },
      ]
    },
    {
      name: '마케팅',
      icon: '📢',
      items: [
        { name: '이메일 발송', href: '/admin/send-email', icon: '📧' },
        { name: 'SMS 발송', href: '/admin/send-sms', icon: '💬' },
        { name: '카카오톡 발송', href: '/admin/send-kakao', icon: '💛' },
        { name: '알림톡 템플릿', href: '/admin/kakao-templates', icon: '📋' },
      ]
    },
  ]

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    )
  }

  const isItemActive = (href: string) => {
    return pathname === href || (href !== '/admin' && pathname.startsWith(href))
  }

  const isGroupActive = (group: MenuGroup) => {
    return group.items.some(item => isItemActive(item.href))
  }

  // 로그인 페이지가 아닌 경우에만 인증 체크
  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/admin/login') {
      router.push('/admin/login')
    }
  }, [status, pathname, router])

  // 로그인 페이지인 경우 레이아웃 없이 children만 렌더링
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // 로딩 중이거나 인증되지 않은 경우
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

  // 관리자 권한 체크
  if (session?.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h1>
          <p className="text-gray-600 mb-4">관리자만 접근할 수 있는 페이지입니다.</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            메인 페이지로 이동
          </Link>
        </div>
      </div>
    )
  }

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
            <span className="text-sm font-medium text-gray-500 border-l pl-3">관리자</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/instructor" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              강사 페이지
            </Link>
            <span className="text-sm text-gray-600">{session?.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
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
              if (isMenuGroup(item)) {
                const isOpen = openGroups.includes(item.name)
                const hasActiveItem = isGroupActive(item)
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleGroup(item.name)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        hasActiveItem
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        {item.name}
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.items.map((subItem) => {
                          const isActive = isItemActive(subItem.href)
                          return (
                            <Link
                              key={subItem.name}
                              href={subItem.href}
                              className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                                isActive
                                  ? 'bg-gray-900 text-white'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <span className="text-base">{subItem.icon}</span>
                              {subItem.name}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              } else {
                const isActive = isItemActive(item.href)
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
              }
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
