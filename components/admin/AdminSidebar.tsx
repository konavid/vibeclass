'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

const navigation = [
  { name: '대시보드', href: '/admin', icon: '📊' },
  { name: '강의 관리', href: '/admin/courses', icon: '📚' },
  { name: '강의 승인', href: '/admin/course-approval', icon: '✓' },
  { name: '강사 관리', href: '/admin/instructors', icon: '👨‍🏫' },
  { name: '강사 신청 관리', href: '/admin/instructor-applications', icon: '📝' },
  { name: '사용자 관리', href: '/admin/users', icon: '👥' },
  { name: '수강 관리', href: '/admin/enrollments', icon: '✅' },
  { name: '이메일 발송', href: '/admin/send-email', icon: '📧' },
  { name: 'SMS 발송', href: '/admin/send-sms', icon: '💬' },
  { name: '결제 관리', href: '/admin/payments', icon: '💳' },
  { name: '카테고리 관리', href: '/admin/categories', icon: '📁' },
  { name: '후기 관리', href: '/admin/reviews', icon: '⭐' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div className="flex flex-col w-64 bg-gray-800">
      <div className="flex items-center justify-center h-16 bg-gray-900">
        <Link href="/admin" className="text-white text-xl font-bold">
          EDU Admin
        </Link>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname?.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{session?.user.name}</p>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-xs font-medium text-gray-300 hover:text-white"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
