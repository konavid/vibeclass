'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthModal } from '@/contexts/AuthModalContext'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { openLoginModal } = useAuthModal()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  return (
    <header className="bg-black/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center py-1">
              <Image
                src="/logo.png"
                alt="바이브 클래스"
                width={180}
                height={60}
                className="h-14 w-auto invert"
                priority
              />
            </Link>
            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              {/* 강의 메뉴 - 온라인 교육으로 바로 연결 */}
              <Link
                href="/courses?type=online"
                className={`inline-flex items-center gap-1.5 text-base font-semibold transition-colors border-b-2 ${
                  pathname.startsWith('/courses')
                    ? 'text-white border-white'
                    : 'text-gray-300 hover:text-white border-transparent hover:border-gray-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                강의
              </Link>
{/* 회사소개 메뉴 숨김
              <Link
                href="/about"
                className={`inline-flex items-center gap-1.5 text-base font-semibold transition-colors border-b-2 ${
                  pathname === '/about'
                    ? 'text-white border-white'
                    : 'text-gray-300 hover:text-white border-transparent hover:border-gray-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                회사소개
              </Link>
              */}
              {/* 블로그 메뉴 숨김
              <Link
                href="/blog"
                className={`inline-flex items-center gap-1.5 text-base font-semibold transition-colors border-b-2 ${
                  pathname.startsWith('/blog')
                    ? 'text-white border-white'
                    : 'text-gray-300 hover:text-white border-transparent hover:border-gray-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                블로그
              </Link>
              */}
{/* 자료실 메뉴 - 에셋 드롭다운으로 통합됨 */}
              <Link
                href="/my/enrollments"
                className={`inline-flex items-center gap-1.5 text-base font-semibold transition-colors border-b-2 ${
                  pathname.startsWith('/my/enrollments')
                    ? 'text-white border-white'
                    : 'text-gray-300 hover:text-white border-transparent hover:border-gray-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                나의 강의
              </Link>
              <Link
                href="/solution"
                className={`inline-flex items-center gap-1.5 text-base font-semibold transition-colors border-b-2 ${
                  pathname === '/solution'
                    ? 'text-orange-400 border-orange-400'
                    : 'text-orange-300 hover:text-orange-400 border-transparent hover:border-orange-400'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                솔루션 문의
              </Link>
              {/* 강사 신청 버튼 - 임시 주석처리
              {session?.user.role !== 'instructor' && (
                <Link
                  href="/instructor-apply"
                  className={`inline-flex items-center gap-1.5 text-base font-semibold transition-colors border-b-2 ${
                    pathname.startsWith('/instructor-apply')
                      ? 'text-yellow-400 border-yellow-400'
                      : 'text-yellow-300 hover:text-yellow-400 border-transparent hover:border-yellow-400'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  강사 신청
                </Link>
              )}
              */}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* 모바일 햄버거 메뉴 버튼 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden text-gray-300 hover:text-white p-2 -m-2 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {session ? (
              <>
                {(session.user.role === 'instructor' || session.user.role === 'admin') && (
                  <a
                    href="/instructor"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-sm font-medium bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    강사
                  </a>
                )}
                {session.user.role === 'admin' && (
                  <a
                    href="/admin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-sm font-medium bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    관리자
                  </a>
                )}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    {session.user.image ? (
                      <img
                        src={session.user.image.replace(/^http:\/\//i, 'https://')}
                        alt={session.user.name || 'User'}
                        className="w-8 h-8 rounded-full border-2 border-gray-700"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full border-2 border-gray-700 bg-gray-700 flex items-center justify-center text-white text-sm font-semibold">
                        {session.user.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <span className="hidden sm:inline">{session.user.name || '사용자'}</span>
                    <svg
                      className={`hidden sm:block w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                      <Link
                        href="/my/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        내 프로필
                      </Link>
                      <Link
                        href="/my/enrollments"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        나의 강의
                      </Link>
                      <Link
                        href="/my/qna"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        내 문의 내역
                      </Link>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={() => {
                          setDropdownOpen(false)
                          signOut({ callbackUrl: '/' })
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => openLoginModal()}
                className="px-4 py-2 min-h-[44px] text-sm font-medium bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors active:scale-95 cursor-pointer touch-manipulation"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                로그인
              </button>
            )}
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* 강의 메뉴 - 온라인 교육으로 바로 연결 */}
              <Link
                href="/courses?type=online"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-base font-medium rounded-md ${
                  pathname.startsWith('/courses')
                    ? 'text-white bg-gray-800'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                강의
              </Link>
{/* 회사소개 메뉴 숨김
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-base font-medium rounded-md ${
                  pathname === '/about'
                    ? 'text-white bg-gray-800'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                회사소개
              </Link>
              */}
              {/* 블로그 메뉴 숨김
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-base font-medium rounded-md ${
                  pathname.startsWith('/blog')
                    ? 'text-white bg-gray-800'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                블로그
              </Link>
              */}
              <Link
                href="/my/enrollments"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-base font-medium rounded-md ${
                  pathname.startsWith('/my/enrollments')
                    ? 'text-white bg-gray-800'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                나의 강의
              </Link>
              <Link
                href="/solution"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-base font-medium rounded-md ${
                  pathname === '/solution'
                    ? 'text-orange-400 bg-gray-800'
                    : 'text-orange-300 hover:text-orange-400 hover:bg-gray-800'
                }`}
              >
                솔루션 문의
              </Link>
              {/* 강사 신청 버튼 - 임시 주석처리
              {session?.user.role !== 'instructor' && (
                <Link
                  href="/instructor-apply"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-base font-medium rounded-md ${
                    pathname.startsWith('/instructor-apply')
                      ? 'text-yellow-400 bg-gray-800'
                      : 'text-yellow-300 hover:text-yellow-400 hover:bg-gray-800'
                  }`}
                >
                  강사 신청
                </Link>
              )}
              */}
              {(session?.user.role === 'instructor' || session?.user.role === 'admin') && (
                <a
                  href="/instructor"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  강사 대시보드
                </a>
              )}
              {session?.user.role === 'admin' && (
                <a
                  href="/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  관리자
                </a>
              )}
              {!session && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    openLoginModal()
                  }}
                  className="w-full mt-4 px-4 py-3 min-h-[48px] text-base font-medium bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors active:scale-95 cursor-pointer touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  로그인
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
